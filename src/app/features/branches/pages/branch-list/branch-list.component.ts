import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { CanDirective } from '../../../../core/directives/can.directive';
import { COUNTRIES, DEFAULT_COUNTRY } from '../../../../core/data/countries';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { branchRowId, type BranchListRow, type BranchUpdateRequest } from '../../../../core/models/branch-admin.model';
import { buildingRowId, type BuildingListRow } from '../../../../core/models/building-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { BRANCHES_DICTIONARY } from '../../branches.dictionary';
import { FloorsDrawerComponent } from '../../components/floors-drawer/floors-drawer.component';
import { BranchesApiService } from '../../services/branches-api.service';

const SELECTED_KEY = 'branches.selected';

const FALLBACK_ZONES = ['Asia/Karachi', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Dhaka', 'Europe/London', 'Europe/Istanbul', 'America/New_York', 'UTC'];

function timeZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list?.length) return list;
  } catch {
    /* older browser */
  }
  return FALLBACK_ZONES;
}

/**
 * Branch management on one screen: pick a branch, see what it holds (buildings, floors, rooms, halls), and manage
 * its buildings and their floors right there — no hopping between pages. Deactivating something that still has
 * things inside is explained up front instead of failing at the end.
 */
@Component({
  selector: 'app-branch-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Button,
    Checkbox,
    Drawer,
    InputText,
    Menu,
    Select,
    SelectButton,
    Skeleton,
    ToggleSwitch,
    EmptyStateComponent,
    FieldErrorComponent,
    PageHeaderComponent,
    FloorsDrawerComponent,
    TranslatePipe,
    CanDirective,
  ],
  templateUrl: './branch-list.component.html',
  styleUrl: './branch-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchListComponent {
  private readonly api = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly countries = COUNTRIES.map((c) => ({ label: c, value: c }));
  readonly zones = timeZones().map((z) => ({ label: z.replace(/_/g, ' '), value: z }));

  // --- data
  readonly rows = signal<BranchListRow[]>([]);
  readonly loading = signal(true);
  readonly status = signal<'active' | 'inactive' | 'all'>('active');
  readonly selectedId = signal<string | null>(null);
  readonly buildings = signal<BuildingListRow[]>([]);
  readonly loadingBuildings = signal(false);
  readonly showInactiveBuildings = signal(false);

  readonly selected = computed(() => this.rows().find((r) => r._id === this.selectedId()) ?? null);
  readonly statusOptions = computed(() => {
    this.i18n.currentLang();
    return [
      { label: this.i18n.t('branches.filter.active'), value: 'active' },
      { label: this.i18n.t('branches.filter.inactiveDeleted'), value: 'inactive' },
      { label: this.i18n.t('branches.filter.all'), value: 'all' },
    ];
  });

  readonly canCreateBranch = computed(() => this.auth.can('branches.create'));
  readonly canEditBranch = computed(() => this.auth.can('branches.edit'));
  readonly canCreateBuilding = computed(() => this.auth.can('buildings.create'));
  readonly canEditFloors = computed(() => this.auth.can('buildings.edit'));
  readonly menuItems = signal<MenuItem[]>([]);

  // --- branch form
  readonly branchFormVisible = signal(false);
  readonly branchEditTarget = signal<BranchListRow | null>(null);
  readonly savingBranch = signal(false);
  readonly branchForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: [''],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    country: [DEFAULT_COUNTRY, [Validators.required, Validators.maxLength(80)]],
    timezone: ['Asia/Karachi', Validators.required],
    active: [true],
  });

  // --- building form
  readonly buildingFormVisible = signal(false);
  readonly buildingEditTarget = signal<BuildingListRow | null>(null);
  readonly savingBuilding = signal(false);
  readonly buildingForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
  });

  // --- floors drawer
  readonly floorsFor = signal<BuildingListRow | null>(null);

  constructor() {
    this.i18n.register(BRANCHES_DICTIONARY);
    this.loadBranches();
  }

  // ---------------------------------------------------------------- loading
  loadBranches(keepSelection = false): void {
    if (!keepSelection) this.loading.set(true);
    this.api.list(1, 100, this.status()).subscribe({
      next: ({ items }) => {
        this.rows.set(items);
        this.loading.set(false);
        const ids = new Set(items.map((r) => r._id));
        let pick = this.selectedId();
        if (!pick || !ids.has(pick)) {
          let remembered: string | null = null;
          try {
            remembered = localStorage.getItem(SELECTED_KEY);
          } catch {
            /* private mode */
          }
          pick = remembered && ids.has(remembered) ? remembered : (items[0]?._id ?? null);
        }
        if (pick !== this.selectedId() || !keepSelection) this.select(pick, !keepSelection);
      },
      error: () => this.loading.set(false),
    });
  }

  select(id: string | null, reloadBuildings = true): void {
    this.selectedId.set(id);
    try {
      if (id) localStorage.setItem(SELECTED_KEY, id);
    } catch {
      /* private mode */
    }
    if (reloadBuildings) {
      this.buildings.set([]);
      if (id) this.loadBuildings(id);
    }
  }

  loadBuildings(branchId = this.selectedId()): void {
    if (!branchId) return;
    this.loadingBuildings.set(true);
    this.buildingsApi.list(1, 100, this.showInactiveBuildings() ? 'all' : 'active', branchId).subscribe({
      next: ({ items }) => {
        this.buildings.set(items);
        this.loadingBuildings.set(false);
      },
      error: () => this.loadingBuildings.set(false),
    });
  }

  /** After a building or floor changes: refresh the cards and the branch counts, keeping the selection. */
  refreshAll(): void {
    this.loadBuildings();
    this.loadBranches(true);
  }

  onStatusChange(v: 'active' | 'inactive' | 'all' | null): void {
    if (!v) return;
    this.status.set(v);
    this.selectedId.set(null);
    this.loadBranches();
  }

  setShowInactiveBuildings(on: boolean): void {
    this.showInactiveBuildings.set(on);
    this.loadBuildings();
  }

  isInactive(x: { deletedAt?: string | null; status: string }): boolean {
    return !!x.deletedAt || x.status === 'inactive';
  }

  initials(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] ?? '?') + (p.length > 1 ? p[1][0] : '')).toUpperCase();
  }

  // ---------------------------------------------------------------- branch form
  openCreateBranch(): void {
    this.branchEditTarget.set(null);
    this.branchForm.reset({ name: '', code: '', city: '', country: DEFAULT_COUNTRY, timezone: 'Asia/Karachi', active: true });
    this.branchForm.controls.code.disable();
    this.branchFormVisible.set(true);
  }

  openEditBranch(row: BranchListRow): void {
    this.branchEditTarget.set(row);
    this.branchForm.controls.code.disable();
    this.branchForm.reset({ name: row.name, code: row.code, city: row.city ?? '', country: row.country ?? '', timezone: row.timezone || 'Asia/Karachi', active: row.active });
    this.branchFormVisible.set(true);
  }

  submitBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const v = this.branchForm.getRawValue();
    const target = this.branchEditTarget();
    this.savingBranch.set(true);
    const done = (detail: string, summary: string) => {
      this.messages.add({ severity: 'success', summary, detail });
      this.savingBranch.set(false);
      this.branchFormVisible.set(false);
      this.loadBranches(true);
    };
    if (target) {
      const body: BranchUpdateRequest = { name: v.name.trim(), city: v.city.trim(), country: v.country.trim(), timezone: v.timezone };
      this.api.update(branchRowId(target), body).subscribe({
        next: () => done(v.name, this.i18n.t('common.updated')),
        error: () => this.savingBranch.set(false),
      });
    } else {
      this.api.create({ name: v.name.trim(), city: v.city.trim(), country: v.country.trim(), timezone: v.timezone, active: true }).subscribe({
        next: (res) => {
          // jump straight to the new branch so its first building can be added
          this.selectedId.set(res._id);
          done(res.name, this.i18n.t('branches.toast.branchCreated'));
        },
        error: () => this.savingBranch.set(false),
      });
    }
  }

  // ---------------------------------------------------------------- branch actions
  branchMenu(event: Event, row: BranchListRow, menu: { toggle: (e: Event) => void }): void {
    const items: MenuItem[] = [];
    const canDelete = this.auth.can('branches.delete');
    if (this.auth.can('branches.edit')) items.push({ label: this.i18n.t('common.edit'), icon: 'pi pi-pencil', command: () => this.openEditBranch(row) });
    if (canDelete) {
      if (this.isInactive(row)) {
        items.push({ label: this.i18n.t('common.restore'), icon: 'pi pi-refresh', command: () => this.restoreBranch(row) });
        if (this.auth.hasAnyRole(['super_admin', 'admin'])) {
          items.push({ separator: true }, { label: this.i18n.t('branches.deleteForever'), icon: 'pi pi-trash', command: () => this.deleteForever(row) });
        }
      } else {
        const blocked = (row.stats?.buildings ?? 0) > 0;
        items.push({
          label: blocked ? this.i18n.t('branches.deactivateBlocked') : this.i18n.t('branches.deactivate'),
          icon: 'pi pi-ban',
          disabled: blocked,
          command: () => this.deactivateBranch(row),
        });
      }
    }
    if (!items.length) return;
    this.menuItems.set(items);
    menu.toggle(event);
  }

  private deactivateBranch(row: BranchListRow): void {
    this.confirmation.confirm({
      header: this.i18n.t('branches.confirmDeactivateHeader'),
      message: this.i18n.t('branches.confirmDeactivateBranchMessage', { name: row.name }),
      icon: 'pi pi-ban',
      variant: 'danger',
      accept: () =>
        this.api.delete(branchRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('branches.deactivate'), detail: this.i18n.t('branches.toast.branchDeactivated') });
            this.selectedId.set(null);
            this.loadBranches();
          },
        }),
    });
  }

  private restoreBranch(row: BranchListRow): void {
    this.api.restore(branchRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.restore'), detail: this.i18n.t('branches.toast.branchRestored') });
        this.loadBranches(true);
      },
    });
  }

  private deleteForever(row: BranchListRow): void {
    this.confirmation.confirm({
      header: this.i18n.t('branches.confirmPermanentDeleteHeader'),
      message: this.i18n.t('branches.confirmPermanentDeleteBranchMessage', { name: row.name }),
      icon: 'pi pi-trash',
      variant: 'danger',
      accept: () =>
        this.api.deletePermanent(branchRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('branches.toast.permanentlyDeleted'), detail: this.i18n.t('branches.toast.branchPermanentlyDeleted') });
            this.selectedId.set(null);
            this.loadBranches();
          },
        }),
    });
  }

  // ---------------------------------------------------------------- buildings
  openCreateBuilding(): void {
    this.buildingEditTarget.set(null);
    this.buildingForm.reset({ name: '' });
    this.buildingFormVisible.set(true);
  }

  openEditBuilding(b: BuildingListRow): void {
    this.buildingEditTarget.set(b);
    this.buildingForm.reset({ name: b.name });
    this.buildingFormVisible.set(true);
  }

  submitBuilding(): void {
    const branch = this.selected();
    if (!branch || this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
      return;
    }
    const name = this.buildingForm.getRawValue().name.trim();
    const target = this.buildingEditTarget();
    this.savingBuilding.set(true);
    const ok = (summary: string) => {
      this.messages.add({ severity: 'success', summary, detail: name });
      this.savingBuilding.set(false);
      this.buildingFormVisible.set(false);
      this.refreshAll();
    };
    if (target) {
      this.buildingsApi.update(buildingRowId(target), { name }).subscribe({ next: () => ok(this.i18n.t('common.updated')), error: () => this.savingBuilding.set(false) });
    } else {
      this.buildingsApi.create({ branchId: branch._id, name }).subscribe({
        next: (created) => {
          ok(this.i18n.t('branches.toast.buildingCreated'));
          // a new building has no floors: take the user straight to adding them
          this.floorsFor.set(created);
        },
        error: () => this.savingBuilding.set(false),
      });
    }
  }

  buildingMenu(event: Event, b: BuildingListRow, menu: { toggle: (e: Event) => void }): void {
    const items: MenuItem[] = [];
    const canDelete = this.auth.can('buildings.delete');
    if (this.auth.can('buildings.edit')) items.push({ label: this.i18n.t('common.edit'), icon: 'pi pi-pencil', command: () => this.openEditBuilding(b) });
    if (canDelete) {
      if (this.isInactive(b)) {
        items.push({ label: this.i18n.t('common.restore'), icon: 'pi pi-refresh', command: () => this.restoreBuilding(b) });
      } else {
        const blocked = (b.stats?.floors ?? 0) > 0;
        items.push({
          label: blocked ? this.i18n.t('branches.deactivateBuildingBlocked') : this.i18n.t('branches.deactivate'),
          icon: 'pi pi-ban',
          disabled: blocked,
          command: () => this.deactivateBuilding(b),
        });
      }
    }
    if (!items.length) return;
    this.menuItems.set(items);
    menu.toggle(event);
  }

  private deactivateBuilding(b: BuildingListRow): void {
    this.confirmation.confirm({
      header: this.i18n.t('branches.confirmDeactivateHeader'),
      message: this.i18n.t('branches.confirmDeactivateBuildingMessage', { name: b.name }),
      icon: 'pi pi-ban',
      variant: 'danger',
      accept: () =>
        this.buildingsApi.delete(buildingRowId(b)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('branches.deactivate'), detail: this.i18n.t('branches.toast.buildingDeactivated') });
            this.refreshAll();
          },
        }),
    });
  }

  private restoreBuilding(b: BuildingListRow): void {
    this.buildingsApi.restore(buildingRowId(b)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.restore'), detail: this.i18n.t('branches.toast.buildingRestored') });
        this.refreshAll();
      },
    });
  }

  openFloors(b: BuildingListRow): void {
    this.floorsFor.set(b);
  }

  /** Rooms of this building live on the Rooms screen — jump there with the building preselected. */
  openRooms(b: BuildingListRow): void {
    void this.router.navigate(['/rooms'], { queryParams: { branchId: b.branchId, buildingId: buildingRowId(b) } });
  }
}
