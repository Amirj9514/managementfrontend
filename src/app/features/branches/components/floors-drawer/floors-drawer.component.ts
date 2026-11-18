import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { concatMap, forkJoin, from, toArray } from 'rxjs';
import { CanDirective } from '../../../../core/directives/can.directive';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { BuildingListRow } from '../../../../core/models/building-admin.model';
import type { FloorListRow } from '../../../../core/models/floor-admin.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { BRANCHES_DICTIONARY } from '../../branches.dictionary';

const norm = (v: string): string => v.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Floors of one building, managed in place: add one or several at once ("Ground, Level 1, Level 2"), rename,
 * reorder, deactivate and restore. A floor that still holds rooms cannot be deactivated — the server says so and
 * the row shows how many rooms it has, so it is never a surprise.
 */
@Component({
  selector: 'app-floors-drawer',
  imports: [FormsModule, Button, Checkbox, Drawer, InputText, Skeleton, TranslatePipe, CanDirective],
  templateUrl: './floors-drawer.component.html',
  styleUrl: './floors-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloorsDrawerComponent {
  private readonly api = inject(FloorsApiService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  private readonly i18n = inject(TranslationService);

  readonly building = input<BuildingListRow | null>(null);
  /** Tells the parent something changed, so building cards and branch counts refresh. */
  readonly changed = output<void>();
  readonly closed = output<void>();

  readonly floors = signal<FloorListRow[]>([]);
  readonly loading = signal(false);
  readonly showInactive = signal(false);
  readonly adding = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly newNames = signal('');
  readonly editingId = signal<string | null>(null);
  readonly editLabel = signal('');

  readonly visibleFloors = computed(() =>
    [...this.floors()]
      .filter((f) => this.showInactive() || !this.isInactive(f))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
  );
  readonly inactiveCount = computed(() => this.floors().filter((f) => this.isInactive(f)).length);

  /** Names typed in the add box, minus blanks, repeats and ones the building already has. */
  readonly plan = computed(() => {
    const have = new Set(this.floors().filter((f) => !this.isInactive(f)).map((f) => norm(f.label)));
    const seen = new Set<string>();
    const fresh: string[] = [];
    let skipped = 0;
    for (const raw of this.newNames().split(/[,\n;]+/)) {
      const name = raw.trim().replace(/\s+/g, ' ');
      if (!name) continue;
      const k = norm(name);
      if (have.has(k) || seen.has(k)) {
        skipped++;
        continue;
      }
      seen.add(k);
      fresh.push(name);
    }
    return { fresh, skipped };
  });

  /** "Level 3" after "Level 2" — a one-tap suggestion for the next floor. */
  readonly nextSuggestion = computed(() => {
    const labels = this.floors().filter((f) => !this.isInactive(f)).map((f) => f.label);
    if (labels.length === 0) return this.i18n.t('floors.groundName');
    const nums = labels.map((l) => /(\d+)\s*$/.exec(l)).filter((m): m is RegExpExecArray => !!m);
    if (nums.length === 0) return `${this.i18n.t('floors.levelWord')} 1`;
    const last = nums.reduce((a, b) => (Number(b[1]) > Number(a[1]) ? b : a));
    return `${labels.find((l) => l.endsWith(last[1]))!.replace(/\s*\d+\s*$/, '')} ${Number(last[1]) + 1}`.trim();
  });

  constructor() {
    this.i18n.register(BRANCHES_DICTIONARY);
    effect(() => {
      const b = this.building();
      untracked(() => {
        this.newNames.set('');
        this.editingId.set(null);
        this.showInactive.set(false);
        if (b) this.load(b._id);
        else this.floors.set([]);
      });
    });
  }

  isInactive(f: FloorListRow): boolean {
    return !!f.deletedAt || f.status === 'inactive';
  }

  private load(buildingId: string): void {
    this.loading.set(true);
    this.api.list(buildingId, 1, 100, 'all').subscribe({
      next: ({ items }) => {
        this.floors.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private reload(): void {
    const b = this.building();
    if (b) this.load(b._id);
    this.changed.emit();
  }

  // --- add
  useSuggestion(): void {
    this.newNames.set(this.nextSuggestion());
  }

  addFloors(): void {
    const b = this.building();
    const names = this.plan().fresh;
    if (!b || names.length === 0 || this.adding()) return;
    this.adding.set(true);
    let done = 0;
    from(names)
      .pipe(
        concatMap((label) => this.api.create({ buildingId: b._id, label })),
        toArray(),
      )
      .subscribe({
        next: (r) => {
          done = r.length;
          this.messages.add({
            severity: 'success',
            summary: this.i18n.t(done === 1 ? 'floors.added.one' : 'floors.added.many', { n: done }),
            detail: names.slice(0, 5).join(', ') + (names.length > 5 ? '…' : ''),
          });
          this.newNames.set('');
          this.adding.set(false);
          this.reload();
        },
        error: () => {
          this.adding.set(false);
          this.reload();
        },
      });
  }

  // --- rename
  startEdit(f: FloorListRow): void {
    this.editingId.set(f._id);
    this.editLabel.set(f.label);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(f: FloorListRow): void {
    const label = this.editLabel().trim().replace(/\s+/g, ' ');
    if (!label || label === f.label) {
      this.editingId.set(null);
      return;
    }
    this.busyId.set(f._id);
    this.api.update(f._id, { label }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.editingId.set(null);
        this.reload();
      },
      // the toast explains (e.g. a floor with that name exists); stay in edit mode to fix it
      error: () => this.busyId.set(null),
    });
  }

  // --- order
  move(f: FloorListRow, dir: -1 | 1): void {
    const list = this.visibleFloors().filter((x) => !this.isInactive(x));
    const i = list.findIndex((x) => x._id === f._id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    // renumber 1..n so the order is explicit even if old values collided
    const changes = next.map((x, idx) => ({ x, order: idx + 1 })).filter(({ x, order }) => x.sortOrder !== order);
    if (changes.length === 0) return;
    this.busyId.set(f._id);
    // optimistic: show the new order at once
    this.floors.update((all) => all.map((x) => changes.find((c) => c.x._id === x._id) ? { ...x, sortOrder: changes.find((c) => c.x._id === x._id)!.order } : x));
    forkJoin(changes.map(({ x, order }) => this.api.update(x._id, { sortOrder: order }))).subscribe({
      next: () => {
        this.busyId.set(null);
        this.changed.emit();
      },
      error: () => {
        this.busyId.set(null);
        this.reload();
      },
    });
  }

  // --- deactivate / restore
  deactivate(f: FloorListRow): void {
    if ((f.stats?.rooms ?? 0) + (f.stats?.halls ?? 0) > 0) {
      this.messages.add({
        severity: 'warn',
        summary: this.i18n.t('floors.hasUnits.title'),
        detail: this.i18n.t('floors.hasUnits.detail', { n: (f.stats?.rooms ?? 0) + (f.stats?.halls ?? 0) }),
      });
      return;
    }
    this.confirmation.confirm({
      header: this.i18n.t('floors.confirm.header'),
      message: this.i18n.t('floors.confirm.message', { name: f.label }),
      icon: 'pi pi-ban',
      variant: 'danger',
      accept: () => {
        this.busyId.set(f._id);
        this.api.delete(f._id).subscribe({
          next: () => {
            this.busyId.set(null);
            this.reload();
          },
          error: () => this.busyId.set(null),
        });
      },
    });
  }

  restore(f: FloorListRow): void {
    this.busyId.set(f._id);
    this.api.restore(f._id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.reload();
      },
      error: () => this.busyId.set(null),
    });
  }

  unitsOf(f: FloorListRow): number {
    return (f.stats?.rooms ?? 0) + (f.stats?.halls ?? 0);
  }

}
