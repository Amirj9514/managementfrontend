import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin, map, of, switchMap, type Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { Drawer } from 'primeng/drawer';
import { Dialog } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Password } from 'primeng/password';
import { Menu } from 'primeng/menu';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import type { Branch } from '../../../../core/models/entity-stubs.model';
import { buildingRowId } from '../../../../core/models/building-admin.model';
import { hasFullAccess, type PermissionCatalog } from '../../../../core/models/permissions.model';
import { PermissionsApiService } from '../../../../core/services/permissions-api.service';
import { PermissionMatrixComponent } from '../../../../shared/permission-matrix/permission-matrix.component';
import { floorRowId } from '../../../../core/models/floor-admin.model';
import { STAFF_ROLE_OPTIONS, isFloorScopedRole } from '../../../../core/models/roles.model';
import {
  adminUserRowId,
  type AdminUserListRow,
  type UserAssignmentPatchRequest,
  type UserCreateRequest,
  type UserUpdateRequest,
} from '../../../../core/models/user-admin.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { TableSkeletonComponent } from '../../../../shared/table-skeleton/table-skeleton.component';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersApiService } from '../../services/users-api.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { USERS_DICTIONARY } from '../../users.dictionary';

@Component({
  selector: 'app-users-list',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    Toolbar,
    Button,
    Paginator,
    Dialog,
    Fluid,
    InputText,
    Password,
    Select,
    MultiSelect,
    Checkbox,
    Drawer,
    Tag,
    Menu,
    NgIcon,
    TableSkeletonComponent,
    FieldErrorComponent,
    PermissionMatrixComponent,
    TranslatePipe,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  private readonly api = inject(UsersApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly permissionsApi = inject(PermissionsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly i18n = inject(TranslationService);

  readonly staffRoleOptions = computed(() => {
    this.i18n.currentLang();
    return STAFF_ROLE_OPTIONS.map((o) => ({ ...o, label: this.i18n.t('role.' + o.value) }));
  });

  readonly rows = signal<AdminUserListRow[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly status = signal<string>('active');

  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly branches = signal<Branch[]>([]);
  readonly branchSelectOptions = computed(() =>
    this.branches()
      .map((b) => ({ label: b.name, value: branchRecordId(b) }))
      .filter((o) => o.value),
  );

  /** Floors ("Building › Floor") of the branches picked in whichever assignment form is open. */
  readonly floorOptions = signal<{ label: string; value: string }[]>([]);
  readonly buildingOptions = signal<{ label: string; value: string }[]>([]);
  private readonly floorRefresh$ = new Subject<void>();
  private readonly buildingSource$ = new Subject<string[]>();

  readonly catalog = signal<PermissionCatalog | null>(null);
  readonly assignPermissions = signal<string[]>([]);

  readonly assignVisible = signal(false);
  readonly assignTarget = signal<AdminUserListRow | null>(null);
  readonly editVisible = signal(false);
  readonly editTarget = signal<AdminUserListRow | null>(null);
  readonly savingAssign = signal(false);
  readonly savingEdit = signal(false);

  readonly menuItems = signal<import('primeng/api').MenuItem[]>([]);

  readonly editForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: [''],
    password: [''],
    status: ['active' as 'active' | 'inactive'],
  });

  readonly assignForm = this.fb.group({
    role: ['', Validators.required],
    branchIds: [[] as string[]],
    buildingIds: [[] as string[]],
    floorIds: [[] as string[]],
    updateScopes: [false],
  });

  constructor() {
    this.i18n.register(USERS_DICTIONARY);
    this.assignForm.controls.updateScopes.valueChanges.subscribe(() => this.cdr.markForCheck());
    this.permissionsApi.getCatalog().subscribe({ next: (cat) => this.catalog.set(cat) });
    // Picking a role pre-fills that role's default permissions; the admin can then tweak them.
    this.assignForm.controls.role.valueChanges.subscribe((role) => {
      this.assignPermissions.set(this.defaultsFor(role));
      this.cdr.markForCheck();
    });
    // Branches -> buildings of those branches (the admin picks from a list, never types IDs).
    this.assignForm.controls.branchIds.valueChanges.subscribe((ids) => this.buildingSource$.next(ids ?? []));
    this.buildingSource$
      .pipe(
        switchMap((ids) => this.fetchBuildingOptions(ids)),
        takeUntilDestroyed(),
      )
      .subscribe((options) => {
        this.buildingOptions.set(options);
        this.keepOnly(this.assignForm.controls.buildingIds, options);
        this.floorRefresh$.next();
      });
    // Buildings (or the role) -> floors, for the floor-limited roles.
    this.assignForm.controls.buildingIds.valueChanges.subscribe(() => this.floorRefresh$.next());
    this.assignForm.controls.role.valueChanges.subscribe(() => this.floorRefresh$.next());
    this.floorRefresh$
      .pipe(
        switchMap(() => this.fetchFloorOptions()),
        takeUntilDestroyed(),
      )
      .subscribe((options) => {
        this.floorOptions.set(options);
        this.keepOnly(this.assignForm.controls.floorIds, options);
      });
    this.branchesApi.list(1, 10).subscribe({
      next: ({ items }) => this.branches.set(items),
      error: () => this.branches.set([]),
    });
    this.reload();
  }

  isFullAccess(role: string | null | undefined): boolean {
    return hasFullAccess(role);
  }

  private defaultsFor(role: string | null | undefined): string[] {
    return [...(this.catalog()?.roleDefaults[role ?? ''] ?? [])];
  }

  isFloorScoped(role: string | null | undefined): boolean {
    return isFloorScopedRole(role);
  }

  /** Drops selected values that are no longer offered (e.g. after removing a branch). */
  private keepOnly(
    control: { value: string[] | null; setValue: (v: string[]) => void },
    options: { value: string }[],
  ): void {
    const valid = new Set(options.map((o) => o.value));
    const current = control.value ?? [];
    const next = current.filter((v) => valid.has(v));
    if (next.length !== current.length) control.setValue(next);
  }

  private fetchBuildingOptions(branchIds: string[]): Observable<{ label: string; value: string }[]> {
    if (!branchIds.length) return of([]);
    const branchName = new Map(this.branches().map((b) => [branchRecordId(b), b.name]));
    return forkJoin(branchIds.map((id) => this.buildingsApi.list(1, 100, 'active', id))).pipe(
      map((pages) =>
        pages.flatMap((p) =>
          p.items.map((b) => ({
            label: branchName.get(b.branchId) ? `${branchName.get(b.branchId)} › ${b.name}` : b.name,
            value: buildingRowId(b),
          })),
        ),
      ),
    );
  }

  /** Floors of the chosen buildings — or of every building in the chosen branches when none is chosen. */
  private fetchFloorOptions(): Observable<{ label: string; value: string }[]> {
    if (!this.isFloorScoped(this.assignForm.controls.role.value)) return of([]);
    const chosen = this.assignForm.controls.buildingIds.value ?? [];
    const all = this.buildingOptions();
    const targets = chosen.length ? all.filter((b) => chosen.includes(b.value)) : all;
    if (!targets.length) return of([]);
    return forkJoin(
      targets.map((b) =>
        this.floorsApi.list(b.value, 1, 100, 'active').pipe(
          map(({ items }) => items.map((f) => ({ label: `${b.label} › ${f.label}`, value: floorRowId(f) }))),
        ),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  reload(): void {
    this.loading.set(true);
    this.api.list(this.page(), this.pageSize(), this.status()).subscribe({
      next: ({ items, pagination }) => {
        this.rows.set(items);
        this.totalRecords.set(pagination.total);
        this.page.set(pagination.page);
        this.pageSize.set(pagination.limit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusChange(value: string | null): void {
    if (value) {
      this.status.set(value);
      this.page.set(1);
      this.reload();
    }
  }

  onPaginatorChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    const nextPage = Math.floor(first / rows) + 1;
    this.page.set(nextPage);
    this.pageSize.set(rows);
    this.reload();
  }

  goNew(): void {
    void this.router.navigate(['/users/new']);
  }

  openEdit(row: AdminUserListRow): void {
    this.editTarget.set(row);
    this.editForm.reset({
      email: row.email,
      name: row.name || '',
      password: '',
      status: row.status as 'active' | 'inactive',
    });
    this.editVisible.set(true);
  }

  submitEdit(): void {
    const row = this.editTarget();
    if (!row) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.getRawValue();
    const body: UserUpdateRequest = {
      email: v.email!.trim(),
      name: (v.name ?? '').trim() || undefined,
      status: v.status!,
    };
    if (v.password) body.password = v.password;

    this.savingEdit.set(true);
    this.api.update(adminUserRowId(row), body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.updated'), detail: this.i18n.t('users.toast.userDetailsSaved') });
        this.editVisible.set(false);
        this.editTarget.set(null);
        this.reload();
      },
      error: () => this.savingEdit.set(false),
      complete: () => this.savingEdit.set(false),
    });
  }

  openAssign(row: AdminUserListRow): void {
    this.assignTarget.set(row);
    this.assignForm.reset({
      role: row.role,
      branchIds: [],
      buildingIds: [],
      floorIds: [],
      updateScopes: false,
    });
    this.floorOptions.set([]);
    this.buildingOptions.set([]);
    this.assignPermissions.set(row.permissions ? [...row.permissions] : this.defaultsFor(row.role));
    this.assignVisible.set(true);
  }

  submitAssign(): void {
    const row = this.assignTarget();
    if (!row) return;
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    const v = this.assignForm.getRawValue();
    const patch: UserAssignmentPatchRequest = { role: v.role! };
    if (v.updateScopes) {
      patch.branchIds = v.branchIds ?? [];
      patch.buildingIds = v.buildingIds ?? [];
      patch.floorIds = isFloorScopedRole(v.role) ? (v.floorIds ?? []) : [];
    }
    this.savingAssign.set(true);
    const userId = adminUserRowId(row);
    const savePermissions = !hasFullAccess(v.role);
    this.api
      .patchAssignment(userId, patch)
      .pipe(
        switchMap(() =>
          savePermissions ? this.api.patchPermissions(userId, this.assignPermissions()) : of(undefined),
        ),
      )
      .subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.updated'), detail: this.i18n.t('users.toast.roleAssignmentSaved') });
        this.assignVisible.set(false);
        this.assignTarget.set(null);
        this.reload();
      },
      error: () => this.savingAssign.set(false),
      complete: () => this.savingAssign.set(false),
    });
  }

  onDelete(row: AdminUserListRow): void {
    this.confirmation.confirm({
      message: this.i18n.t('users.confirmDeactivateMessage', { name: row.name || row.email }),
      header: this.i18n.t('users.confirmDeactivateHeader'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(adminUserRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('users.deactivate'), detail: this.i18n.t('users.toast.userDeactivated') });
            this.reload();
          },
        });
      },
    });
  }

  onRestore(row: AdminUserListRow): void {
    this.api.restore(adminUserRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('users.restore'), detail: this.i18n.t('users.toast.userRestored') });
        this.reload();
      },
    });
  }

  onPermanentDelete(row: AdminUserListRow): void {
    this.confirmation.confirm({
      message: this.i18n.t('users.confirmPermanentDeleteMessage', { name: row.name || row.email }),
      header: this.i18n.t('users.confirmPermanentDeleteHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deletePermanent(adminUserRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('users.toast.permanentlyDeleted'), detail: this.i18n.t('users.toast.userPermanentlyDeleted') });
            this.reload();
          },
        });
      },
    });
  }

  isAuthorizedForPermanentDelete(): boolean {
    return this.auth.hasAnyRole(['super_admin', 'admin']);
  }

  prepareActions(event: Event, row: AdminUserListRow, menu: any): void {
    const items: import('primeng/api').MenuItem[] = [
      {
        label: this.i18n.t('common.edit'),
        icon: 'pi pi-pencil',
        command: () => this.openEdit(row),
      },
      {
        label: this.i18n.t('users.roleAssignment'),
        icon: 'pi pi-id-card',
        command: () => this.openAssign(row),
      },
    ];

    if (row.deletedAt || row.status === 'inactive') {
      items.push({
        label: this.i18n.t('users.restore'),
        icon: 'pi pi-refresh',
        command: () => this.onRestore(row),
      });

      if (this.isAuthorizedForPermanentDelete()) {
        items.push({
          label: this.i18n.t('users.deleteForever'),
          icon: 'pi pi-trash',
          command: () => this.onPermanentDelete(row),
        });
      }
    } else {
      items.push({
        label: this.i18n.t('users.deactivate'),
        icon: 'pi pi-trash',
        command: () => this.onDelete(row),
      });
    }

    this.menuItems.set(items);
    menu.toggle(event);
  }

}

function branchRecordId(b: Branch): string {
  return b.id ?? b._id ?? '';
}
