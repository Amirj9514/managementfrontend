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
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
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
import { STAFF_ROLE_OPTIONS } from '../../../../core/models/roles.model';
import {
  adminUserRowId,
  parseIdListCsv,
  type AdminUserListRow,
  type UserAssignmentPatchRequest,
  type UserCreateRequest,
  type UserUpdateRequest,
} from '../../../../core/models/user-admin.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { TableSkeletonComponent } from '../../../../shared/table-skeleton/table-skeleton.component';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersApiService } from '../../services/users-api.service';

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
    ConfirmDialog,
    Drawer,
    Tag,
    Menu,
    NgIcon,
    TableSkeletonComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  private readonly api = inject(UsersApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly staffRoleOptions = STAFF_ROLE_OPTIONS;

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

  readonly createVisible = signal(false);
  readonly assignVisible = signal(false);
  readonly assignTarget = signal<AdminUserListRow | null>(null);
  readonly editVisible = signal(false);
  readonly editTarget = signal<AdminUserListRow | null>(null);
  readonly savingCreate = signal(false);
  readonly savingAssign = signal(false);
  readonly savingEdit = signal(false);

  readonly menuItems = signal<import('primeng/api').MenuItem[]>([]);

  readonly createForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    name: [''],
    role: ['front_desk', Validators.required],
    branchIds: [[] as string[]],
    buildingIdsText: [''],
    withAssignment: [false],
  });
  
  readonly editForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: [''],
    password: [''],
    status: ['active' as 'active' | 'inactive'],
  });

  readonly assignForm = this.fb.group({
    role: ['', Validators.required],
    branchIds: [[] as string[]],
    buildingIdsText: [''],
    updateScopes: [false],
  });

  constructor() {
    this.createForm.controls.withAssignment.valueChanges.subscribe(() => this.cdr.markForCheck());
    this.assignForm.controls.updateScopes.valueChanges.subscribe(() => this.cdr.markForCheck());
    this.branchesApi.list(1, 10).subscribe({
      next: ({ items }) => this.branches.set(items),
      error: () => this.branches.set([]),
    });
    this.reload();
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

  openCreate(): void {
    this.createForm.reset({
      email: '',
      password: '',
      name: '',
      role: 'front_desk',
      branchIds: [],
      buildingIdsText: '',
      withAssignment: false,
    });
    this.createVisible.set(true);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.getRawValue();
    const body: UserCreateRequest = {
      email: v.email!.trim(),
      password: v.password!,
      name: (v.name ?? '').trim() || undefined,
      role: v.role!,
    };
    if (v.withAssignment) {
      body.assignment = {
        branchIds: v.branchIds ?? [],
        buildingIds: parseIdListCsv(v.buildingIdsText ?? ''),
      };
    }
    this.savingCreate.set(true);
    this.api.create(body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'User created', detail: body.email });
        this.createVisible.set(false);
        this.reload();
      },
      complete: () => this.savingCreate.set(false),
    });
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
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'User details saved.' });
        this.editVisible.set(false);
        this.editTarget.set(null);
        this.reload();
      },
      complete: () => this.savingEdit.set(false),
    });
  }

  openAssign(row: AdminUserListRow): void {
    this.assignTarget.set(row);
    this.assignForm.reset({
      role: row.role,
      branchIds: [],
      buildingIdsText: '',
      updateScopes: false,
    });
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
      patch.buildingIds = parseIdListCsv(v.buildingIdsText ?? '');
    }
    this.savingAssign.set(true);
    this.api.patchAssignment(adminUserRowId(row), patch).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Role and assignment saved.' });
        this.assignVisible.set(false);
        this.assignTarget.set(null);
        this.reload();
      },
      complete: () => this.savingAssign.set(false),
    });
  }

  onDelete(row: AdminUserListRow): void {
    this.confirmation.confirm({
      message: `Are you sure you want to deactivate ${row.name || row.email}?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(adminUserRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deactivated', detail: 'User marked as inactive.' });
            this.reload();
          },
        });
      },
    });
  }

  onRestore(row: AdminUserListRow): void {
    this.api.restore(adminUserRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Restored', detail: 'User is now active again.' });
        this.reload();
      },
    });
  }

  onPermanentDelete(row: AdminUserListRow): void {
    this.confirmation.confirm({
      message: `PERMANENT DELETE: This will completely remove ${row.name || row.email} from the database. This action cannot be undone. Proceed?`,
      header: 'PERMANENT DELETE',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deletePermanent(adminUserRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Permanently Deleted', detail: 'User removed from system.' });
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
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEdit(row),
      },
      {
        label: 'Role & assignment',
        icon: 'pi pi-id-card',
        command: () => this.openAssign(row),
      },
    ];

    if (row.deletedAt || row.status === 'inactive') {
      items.push({
        label: 'Restore',
        icon: 'pi pi-refresh',
        command: () => this.onRestore(row),
      });

      if (this.isAuthorizedForPermanentDelete()) {
        items.push({
          label: 'Delete Forever',
          icon: 'pi pi-trash',
          command: () => this.onPermanentDelete(row),
        });
      }
    } else {
      items.push({
        label: 'Deactivate',
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
