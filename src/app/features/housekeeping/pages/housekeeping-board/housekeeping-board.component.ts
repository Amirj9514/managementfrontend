import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { Textarea } from 'primeng/textarea';
import { interval } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type { Cleaner, CleaningBoard, CleaningTask } from '../../../../core/models/housekeeping.model';
import type { PrivateRoomRow } from '../../../../core/models/unit-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { RoomsApiService } from '../../../rooms/services/rooms-api.service';
import { HOUSEKEEPING_DICTIONARY } from '../../housekeeping.dictionary';
import { HousekeepingApiService } from '../../services/housekeeping-api.service';

type Column = 'todo' | 'working' | 'review' | 'done';

/** Case- and spacing-insensitive, so "ali  Khan" and "Ali Khan" are the same cleaner. */
const normalize = (name: string): string => name.trim().replace(/\s+/g, ' ').toLowerCase();

/** Pending rooms older than this get a warning tint on the card. */
const STALE_MINUTES = 60;

/**
 * Housekeeping board. A room becomes a card in "To clean" the moment it is checked out of (or
 * transferred away from); a supervisor gives it to a cleaner, the cleaner starts and finishes it,
 * and a supervisor verifies it — only then does the room turn Available. Each action only shows for
 * people holding the matching permission (the server enforces the same rules).
 */
@Component({
  selector: 'app-housekeeping-board',
  imports: [
    FormsModule,
    Button,
    Checkbox,
    Dialog,
    InputText,
    Select,
    Skeleton,
    Textarea,
    EmptyStateComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './housekeeping-board.component.html',
  styleUrl: './housekeeping-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HousekeepingBoardComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(HousekeepingApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(TranslationService);

  private readonly me = toSignal(this.auth.user$, { initialValue: null });
  readonly canAssign = computed(() => this.auth.can('housekeeping.assign'));
  readonly canClean = computed(() => this.auth.can('housekeeping.clean'));
  readonly canVerify = computed(() => this.auth.can('housekeeping.verify'));

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly buildingId = signal<string | null>(null);
  readonly onlyMine = signal(false);

  readonly board = signal<CleaningBoard | null>(null);
  readonly loading = signal(true);
  /** Task currently being changed — keeps its buttons disabled so it cannot be sent twice. */
  readonly busyId = signal<string | null>(null);
  /** Re-evaluated every minute so "waiting 2 h" stays honest on a board that is left open. */
  private readonly now = signal(Date.now());

  readonly selected = signal<string[]>([]);

  // --- dialogs
  readonly assignOpen = signal(false);
  readonly assignTaskIds = signal<string[]>([]);
  readonly cleaners = signal<Cleaner[]>([]);
  readonly cleanerName = signal('');
  readonly assignNote = signal('');

  readonly cleanedTask = signal<CleaningTask | null>(null);
  readonly cleanedNote = signal('');

  readonly rejectTask = signal<CleaningTask | null>(null);
  readonly rejectNote = signal('');

  readonly requestOpen = signal(false);
  readonly requestRooms = signal<PrivateRoomRow[]>([]);
  readonly requestRoomId = signal<string | null>(null);
  readonly requestNote = signal('');
  readonly saving = signal(false);

  private readonly allTasks = computed(() => this.board()?.tasks ?? []);

  readonly buildings = computed(() => {
    const seen = new Map<string, string>();
    for (const t of this.allTasks()) if (t.buildingId && t.buildingName) seen.set(t.buildingId, t.buildingName);
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });

  private readonly visible = computed(() => {
    const building = this.buildingId();
    const mine = this.onlyMine();
    const meName = normalize(this.me()?.name ?? '');
    return this.allTasks().filter(
      (t) => (!building || t.buildingId === building) && (!mine || (!!meName && normalize(t.cleanerName ?? '') === meName)),
    );
  });

  readonly columns = computed(() => {
    const byRoom = (a: CleaningTask, b: CleaningTask) =>
      (a.buildingName ?? '').localeCompare(b.buildingName ?? '') ||
      a.floorOrder - b.floorOrder ||
      a.unitCode.localeCompare(b.unitCode, undefined, { numeric: true });
    const pick = (f: (t: CleaningTask) => boolean) => this.visible().filter(f).sort(byRoom);
    return [
      { key: 'todo' as Column, tasks: pick((t) => t.status === 'pending'), icon: 'pi pi-inbox', tone: 'warn' },
      {
        key: 'working' as Column,
        tasks: pick((t) => t.status === 'assigned' || t.status === 'in_progress'),
        icon: 'pi pi-sparkles',
        tone: 'info',
      },
      { key: 'review' as Column, tasks: pick((t) => t.status === 'awaiting_verification'), icon: 'pi pi-search', tone: 'help' },
      {
        key: 'done' as Column,
        tasks: this.visible().filter((t) => t.status === 'done').sort((a, b) => (b.verifiedAt ?? '').localeCompare(a.verifiedAt ?? '')),
        icon: 'pi pi-check-circle',
        tone: 'success',
      },
    ];
  });

  readonly isEmpty = computed(() => !this.loading() && this.allTasks().length === 0);
  readonly todoIds = computed(() => this.columns()[0].tasks.map((t) => t._id));
  readonly allTodoSelected = computed(
    () => this.todoIds().length > 0 && this.todoIds().every((id) => this.selected().includes(id)),
  );

  readonly assignRoomCodes = computed(() => {
    const ids = new Set(this.assignTaskIds());
    return this.allTasks().filter((t) => ids.has(t._id)).map((t) => t.unitCode).join(', ');
  });
  readonly roomOptions = computed(() =>
    this.requestRooms().map((r) => ({ id: r._id, label: r.code })),
  );

  constructor() {
    this.i18n.register(HOUSEKEEPING_DICTIONARY);
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        if (items.length) {
          this.branchId.set(items[0]._id);
          this.reload();
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
    // Keep an open board fresh: other people assign / clean / verify at the same time.
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.now.set(Date.now());
        if (!this.busyId() && !this.assignOpen() && !this.requestOpen()) this.reload(true);
      });
  }

  onBranchChange(id: string | null): void {
    this.branchId.set(id ?? undefined);
    this.buildingId.set(null);
    this.selected.set([]);
    this.reload();
  }

  reload(quiet = false): void {
    const branchId = this.branchId();
    if (!branchId) return;
    if (!quiet) this.loading.set(true);
    this.api.board({ branchId }).subscribe({
      next: (b) => {
        this.board.set(b);
        // Drop selections that left the "To clean" column (assigned by someone else, etc.).
        const open = new Set(b.tasks.filter((t) => t.status === 'pending').map((t) => t._id));
        this.selected.update((s) => s.filter((id) => open.has(id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // --- selection
  isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  toggle(id: string, on: boolean): void {
    this.selected.update((s) => (on ? [...new Set([...s, id])] : s.filter((x) => x !== id)));
  }

  toggleAll(on: boolean): void {
    this.selected.set(on ? this.todoIds() : []);
  }

  // --- helpers for the template
  isMine(t: CleaningTask): boolean {
    const me = normalize(this.me()?.name ?? '');
    return !!me && normalize(t.cleanerName ?? '') === me;
  }

  /** Cleaners are plain names, so anyone with the cleaning (or assign) permission records the work. */
  mayWork(): boolean {
    return this.canClean() || this.canAssign();
  }

  /** Suggestions that match what is being typed (or everything when the box is empty). */
  readonly suggestions = computed(() => {
    const typed = normalize(this.cleanerName());
    return this.cleaners().filter((c) => !typed || normalize(c.name).includes(typed));
  });

  pickName(name: string): void {
    this.cleanerName.set(name);
  }

  waiting(t: CleaningTask): string {
    const since = t.createdAt ? new Date(t.createdAt).getTime() : this.now();
    const minutes = Math.max(0, Math.floor((this.now() - since) / 60_000));
    if (minutes < 1) return this.i18n.t('hk.time.now');
    if (minutes < 60) return this.i18n.t('hk.time.min', { n: minutes });
    if (minutes < 60 * 24) return this.i18n.t('hk.time.hour', { n: Math.floor(minutes / 60) });
    return this.i18n.t('hk.time.day', { n: Math.floor(minutes / (60 * 24)) });
  }

  isStale(t: CleaningTask): boolean {
    if (t.status !== 'pending' || !t.createdAt) return false;
    return this.now() - new Date(t.createdAt).getTime() > STALE_MINUTES * 60_000;
  }

  // --- assign
  openAssign(ids: string[]): void {
    if (!ids.length || !this.branchId()) return;
    this.assignTaskIds.set(ids);
    this.cleanerName.set('');
    this.assignNote.set('');
    this.assignOpen.set(true);
    this.api.cleaners(this.branchId()!).subscribe({ next: (c) => this.cleaners.set(c) });
  }

  submitAssign(): void {
    const name = this.cleanerName().trim().replace(/\s+/g, ' ');
    if (!name || this.saving()) return;
    const ids = this.assignTaskIds();
    this.saving.set(true);
    this.api.assign(ids, name, this.assignNote().trim()).subscribe({
      next: ({ assigned, cleanerName }) => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('hk.toast.assigned'),
          detail: this.i18n.t('hk.toast.assignedDetail', { count: assigned, name: cleanerName }),
        });
        this.saving.set(false);
        this.assignOpen.set(false);
        this.selected.set([]);
        this.reload(true);
      },
      error: () => {
        this.saving.set(false);
        this.reload(true);
      },
    });
  }

  confirmUnassign(t: CleaningTask): void {
    this.confirmation.confirm({
      header: this.i18n.t('hk.unassignHeader'),
      message: this.i18n.t('hk.unassignMessage', { room: t.unitCode }),
      accept: () => this.act(t, this.api.unassign(t._id), 'hk.toast.unassigned'),
    });
  }

  // --- cleaner
  start(t: CleaningTask): void {
    this.act(t, this.api.start(t._id), 'hk.toast.started');
  }

  openCleaned(t: CleaningTask): void {
    this.cleanedNote.set('');
    this.cleanedTask.set(t);
  }

  submitCleaned(): void {
    const t = this.cleanedTask();
    if (!t) return;
    this.cleanedTask.set(null);
    this.act(t, this.api.complete(t._id, this.cleanedNote().trim()), 'hk.toast.cleaned', 'hk.toast.cleanedDetail');
  }

  // --- supervisor
  confirmVerify(t: CleaningTask): void {
    this.confirmation.confirm({
      header: this.i18n.t('hk.verifyHeader'),
      message: this.i18n.t('hk.verifyMessage', { room: t.unitCode }),
      icon: 'pi pi-check-circle',
      variant: 'success',
      accept: () => this.act(t, this.api.verify(t._id), 'hk.toast.verified', 'hk.toast.verifiedDetail'),
    });
  }

  openReject(t: CleaningTask): void {
    this.rejectNote.set('');
    this.rejectTask.set(t);
  }

  submitReject(): void {
    const t = this.rejectTask();
    const note = this.rejectNote().trim();
    if (!t || !note) return;
    this.rejectTask.set(null);
    this.act(t, this.api.reject(t._id, note), 'hk.toast.sentBack');
  }

  // --- manual request
  openRequest(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.requestRoomId.set(null);
    this.requestNote.set('');
    this.requestOpen.set(true);
    this.roomsApi.list({ branchId, status: 'available' }, 1, 300).subscribe({
      next: ({ items }) => this.requestRooms.set(items),
    });
  }

  submitRequest(): void {
    const unitId = this.requestRoomId();
    if (!unitId || this.saving()) return;
    this.saving.set(true);
    this.api.request(unitId, this.requestNote().trim()).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('hk.toast.requested') });
        this.saving.set(false);
        this.requestOpen.set(false);
        this.reload(true);
      },
      error: () => {
        this.saving.set(false);
        this.reload(true);
      },
    });
  }

  /** Runs one task action: disables the card, toasts on success, always refreshes from the server. */
  private act(t: CleaningTask, call: ReturnType<HousekeepingApiService['start']>, toast: string, detail?: string): void {
    this.busyId.set(t._id);
    call.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t(toast),
          detail: detail ? this.i18n.t(detail, { room: t.unitCode }) : undefined,
        });
        this.busyId.set(null);
        this.reload(true);
      },
      error: () => {
        this.busyId.set(null);
        this.reload(true);
      },
    });
  }
}
