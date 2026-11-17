import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { forkJoin, map, of, switchMap } from 'rxjs';
import type { Observable } from 'rxjs';
import { CanDirective } from '../../../../core/directives/can.directive';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type { AmenityRow } from '../../../../core/models/unit-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { AMENITIES_DICTIONARY } from '../../amenities.dictionary';
import { AmenitiesApiService } from '../../services/amenities-api.service';

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'grid' | 'list';

interface Preset {
  name: string;
  icon: string;
  category: string;
}

/** Icons offered in the picker (PrimeIcons that exist in this build). */
export const AMENITY_ICONS: readonly string[] = [
  'pi-wifi', 'pi-desktop', 'pi-cloud', 'pi-sun', 'pi-moon', 'pi-bolt', 'pi-lightbulb', 'pi-power-off',
  'pi-car', 'pi-key', 'pi-lock', 'pi-shield', 'pi-phone', 'pi-mobile', 'pi-video', 'pi-camera',
  'pi-headphones', 'pi-volume-up', 'pi-microphone', 'pi-bell', 'pi-home', 'pi-building', 'pi-users', 'pi-star',
  'pi-heart', 'pi-gift', 'pi-box', 'pi-truck', 'pi-shopping-bag', 'pi-shopping-cart', 'pi-wallet', 'pi-credit-card',
  'pi-book', 'pi-briefcase', 'pi-print', 'pi-wrench', 'pi-cog', 'pi-sparkles', 'pi-palette', 'pi-globe',
  'pi-map', 'pi-clock', 'pi-calendar', 'pi-flag', 'pi-bookmark', 'pi-thumbs-up', 'pi-face-smile', 'pi-check-circle',
];

/** One-click starters for a new property — only those not already in the catalog are shown. */
const PRESETS: readonly Preset[] = [
  { name: 'Wi-Fi', icon: 'pi pi-wifi', category: 'Connectivity' },
  { name: 'Air conditioning', icon: 'pi pi-cloud', category: 'Comfort' },
  { name: 'Heater', icon: 'pi pi-sun', category: 'Comfort' },
  { name: 'Television', icon: 'pi pi-desktop', category: 'Entertainment' },
  { name: 'Hot water', icon: 'pi pi-bolt', category: 'Bathroom' },
  { name: 'Private bathroom', icon: 'pi pi-home', category: 'Bathroom' },
  { name: 'Parking', icon: 'pi pi-car', category: 'Facilities' },
  { name: 'Breakfast', icon: 'pi pi-gift', category: 'Food' },
  { name: 'Laundry', icon: 'pi pi-box', category: 'Services' },
  { name: 'Room service', icon: 'pi pi-bell', category: 'Services' },
  { name: 'In-room safe', icon: 'pi pi-lock', category: 'Security' },
  { name: 'Study desk', icon: 'pi pi-book', category: 'Facilities' },
];

const VIEW_KEY = 'amenities.view';

const norm = (v: string): string => v.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Amenity catalog: a searchable, filterable card (or table) view with usage counts, a guided add/edit
 * dialog (icon picker, category suggestions, branch scope, live preview) and one-click starter amenities.
 */
@Component({
  selector: 'app-amenity-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    Dialog,
    Fluid,
    IconField,
    InputIcon,
    InputText,
    Select,
    SelectButton,
    Skeleton,
    ToggleSwitch,
    EmptyStateComponent,
    FieldErrorComponent,
    PageHeaderComponent,
    TranslatePipe,
    CanDirective,
  ],
  templateUrl: './amenity-list.component.html',
  styleUrl: './amenity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmenityListComponent {
  private readonly api = inject(AmenitiesApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  readonly i18n = inject(TranslationService);

  readonly canCreate = computed(() => this.auth.can('amenities.create'));
  readonly canEdit = computed(() => this.auth.can('amenities.edit'));
  private readonly isAdmin = this.auth.hasAnyRole(['super_admin', 'admin']);

  readonly icons = AMENITY_ICONS;

  readonly rows = signal<AmenityRow[]>([]);
  readonly loading = signal(true);
  readonly branches = signal<BranchListRow[]>([]);
  /** Row whose switch / delete is in flight, so it cannot be hit twice. */
  readonly busyId = signal<string | null>(null);

  // --- filters
  readonly search = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly category = signal<string | null>(null);
  readonly view = signal<ViewMode>(this.loadView());

  readonly statusOptions = computed(() => [
    { label: this.i18n.t('amenities.filter.all'), value: 'all' as StatusFilter },
    { label: this.i18n.t('status.active'), value: 'active' as StatusFilter },
    { label: this.i18n.t('status.inactive'), value: 'inactive' as StatusFilter },
  ]);
  readonly viewOptions = [
    { icon: 'pi pi-th-large', value: 'grid' as ViewMode, aria: 'amenities.view.grid' },
    { icon: 'pi pi-list', value: 'list' as ViewMode, aria: 'amenities.view.list' },
  ];

  readonly categories = computed(() =>
    [...new Set(this.rows().map((r) => (r.category ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  );
  readonly categoryOptions = computed(() => this.categories().map((c) => ({ label: c, value: c })));

  readonly stats = computed(() => {
    const all = this.rows();
    const used = (r: AmenityRow) => (r.usage?.rooms ?? 0) + (r.usage?.halls ?? 0) > 0;
    return {
      total: all.length,
      active: all.filter((r) => r.active).length,
      inactive: all.filter((r) => !r.active).length,
      unused: all.filter((r) => !used(r)).length,
    };
  });

  readonly filtered = computed(() => {
    const q = norm(this.search());
    const st = this.status();
    const cat = this.category();
    return this.rows()
      .filter((r) => (st === 'all' || (st === 'active') === r.active) && (!cat || (r.category ?? '').trim() === cat))
      .filter((r) => !q || norm(r.name).includes(q) || norm(r.category ?? '').includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Cards grouped under their category, uncategorised last. */
  readonly groups = computed(() => {
    const map = new Map<string, AmenityRow[]>();
    for (const r of this.filtered()) {
      const key = (r.category ?? '').trim();
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map]
      .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
      .map(([key, items]) => ({ key, items }));
  });

  readonly hasFilters = computed(() => !!this.search().trim() || this.status() !== 'all' || !!this.category());

  /** Starter amenities not yet in the catalog (by name). */
  readonly presets = computed(() => {
    const have = new Set(this.rows().map((r) => norm(r.name)));
    return PRESETS.filter((p) => !have.has(norm(p.name)));
  });

  // --- dialog
  readonly formVisible = signal(false);
  readonly editTarget = signal<AmenityRow | null>(null);
  readonly saving = signal(false);
  readonly isEdit = computed(() => this.editTarget() !== null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    icon: [''],
    category: ['', Validators.maxLength(40)],
    branchId: [null as string | null],
    active: [true],
  });
  /** Mirrors of the form fields for the live preview (OnPush-safe). */
  readonly previewName = signal('');
  readonly previewIcon = signal('');
  readonly previewCategory = signal('');

  readonly branchOptions = computed(() => {
    const own = this.branches().map((b) => ({ id: b._id as string | null, name: b.name }));
    return this.isAdmin ? [{ id: null as string | null, name: this.i18n.t('amenities.allBranches') }, ...own] : own;
  });
  /** Category chips offered in the dialog, narrowed as you type. */
  readonly categorySuggestions = computed(() => {
    const typed = norm(this.previewCategory());
    return this.categories().filter((c) => !typed || (norm(c).includes(typed) && norm(c) !== typed));
  });

  constructor() {
    this.i18n.register(AMENITIES_DICTIONARY);
    this.form.controls.name.valueChanges.subscribe((v) => this.previewName.set(v));
    this.form.controls.icon.valueChanges.subscribe((v) => this.previewIcon.set(v));
    this.form.controls.category.valueChanges.subscribe((v) => this.previewCategory.set(v));
    this.branchesApi.list(1, 100, 'active').subscribe({ next: ({ items }) => this.branches.set(items) });
    this.reload();
  }

  private loadView(): ViewMode {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      return v === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  }

  setView(v: ViewMode | null): void {
    if (!v) return;
    this.view.set(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  }

  /** Every page (the API caps a page at 100), so counts and filters are always complete. */
  private fetchAll(): Observable<AmenityRow[]> {
    return this.api.list(1, 100).pipe(
      switchMap((first) => {
        const pages = Math.ceil(first.pagination.total / 100);
        if (pages <= 1) return of(first.items);
        const rest = Array.from({ length: pages - 1 }, (_, i) => this.api.list(i + 2, 100));
        return forkJoin(rest).pipe(map((r) => [...first.items, ...r.flatMap((p) => p.items)]));
      }),
    );
  }

  reload(): void {
    this.loading.set(true);
    this.fetchAll().subscribe({
      next: (items) => {
        this.rows.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.status.set('all');
    this.category.set(null);
  }

  // --- presentation helpers
  iconOf(r: { icon?: string | null }): string {
    const i = (r.icon ?? '').trim();
    return i ? (i.startsWith('pi ') ? i : `pi ${i}`) : 'pi pi-tag';
  }

  usageText(r: AmenityRow): string {
    const rooms = r.usage?.rooms ?? 0;
    const halls = r.usage?.halls ?? 0;
    if (rooms + halls === 0) return this.i18n.t('amenities.unused');
    return [
      rooms ? this.i18n.t(rooms === 1 ? 'amenities.usedRoom' : 'amenities.usedRooms', { n: rooms }) : '',
      halls ? this.i18n.t(halls === 1 ? 'amenities.usedHall' : 'amenities.usedHalls', { n: halls }) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  scopeText(r: AmenityRow): string {
    return r.branchId ? r.branchName ?? this.i18n.t('amenities.thisBranch') : this.i18n.t('amenities.allBranches');
  }

  // --- add / edit
  openCreate(prefill?: Partial<Preset>): void {
    this.editTarget.set(null);
    const scope = this.isAdmin ? null : this.branches()[0]?._id ?? null;
    this.form.reset({
      name: prefill?.name ?? '',
      icon: (prefill?.icon ?? '').replace(/^pi /, ''),
      category: prefill?.category ?? '',
      branchId: scope,
      active: true,
    });
    this.syncPreview();
    this.formVisible.set(true);
  }

  openEdit(row: AmenityRow): void {
    this.editTarget.set(row);
    this.form.reset({
      name: row.name,
      icon: (row.icon ?? '').replace(/^pi /, ''),
      category: row.category ?? '',
      branchId: row.branchId ?? null,
      active: row.active,
    });
    this.syncPreview();
    this.formVisible.set(true);
  }

  private syncPreview(): void {
    const v = this.form.getRawValue();
    this.previewName.set(v.name);
    this.previewIcon.set(v.icon);
    this.previewCategory.set(v.category);
  }

  pickIcon(icon: string): void {
    this.form.controls.icon.setValue(this.form.controls.icon.value === icon ? '' : icon);
  }

  pickCategory(c: string): void {
    this.form.controls.category.setValue(c);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      name: v.name.trim().replace(/\s+/g, ' '),
      icon: v.icon ? `pi ${v.icon}` : '',
      category: v.category.trim(),
      branchId: v.branchId,
      active: v.active,
    };
    this.saving.set(true);
    const target = this.editTarget();
    const req = target ? this.api.update(target._id, body) : this.api.create(body);
    req.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t(target ? 'common.updated' : 'common.created'),
          detail: body.name,
        });
        this.saving.set(false);
        this.formVisible.set(false);
        this.reload();
      },
      // The error toast already explains (e.g. a duplicate name); keep the dialog open to fix it.
      error: () => this.saving.set(false),
    });
  }

  quickAdd(p: Preset): void {
    if (this.busyId()) return;
    this.busyId.set(p.name);
    const branchId = this.isAdmin ? null : this.branches()[0]?._id ?? null;
    this.api.create({ name: p.name, icon: p.icon, category: p.category, branchId, active: true }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.created'), detail: p.name });
        this.busyId.set(null);
        this.reload();
      },
      error: () => this.busyId.set(null),
    });
  }

  toggleActive(row: AmenityRow, on: boolean): void {
    if (this.busyId()) return;
    this.busyId.set(row._id);
    this.api.update(row._id, { active: on }).subscribe({
      next: () => {
        this.rows.update((all) => all.map((r) => (r._id === row._id ? { ...r, active: on } : r)));
        this.busyId.set(null);
      },
      error: () => {
        this.busyId.set(null);
        this.reload();
      },
    });
  }

  remove(row: AmenityRow): void {
    const used = (row.usage?.rooms ?? 0) + (row.usage?.halls ?? 0);
    this.confirmation.confirm({
      header: this.i18n.t('amenities.confirmRemoveHeader'),
      message: used
        ? this.i18n.t('amenities.confirmRemoveUsed', { name: row.name, usage: this.usageText(row) })
        : this.i18n.t('amenities.confirmRemove', { name: row.name }),
      icon: 'pi pi-trash',
      variant: 'danger',
      accept: () => {
        this.busyId.set(row._id);
        this.api.delete(row._id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('amenities.removed'), detail: row.name });
            this.busyId.set(null);
            this.reload();
          },
          error: () => this.busyId.set(null),
        });
      },
    });
  }
}
