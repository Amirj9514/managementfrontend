import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Drawer } from 'primeng/drawer';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import {
  branchRowId,
  type BranchCreateRequest,
  type BranchListRow,
  type BranchUpdateRequest,
} from '../../../../core/models/branch-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BranchesApiService } from '../../services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { Router } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { BuildingListRow, buildingRowId } from '../../../../core/models/building-admin.model';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { TableSkeletonComponent } from '../../../../shared/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-branch-list',
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
    Fluid,
    InputText,
    Select,
    ConfirmDialog,
    Drawer,
    Tag,
    Menu,
    NgIcon,
    Ripple,
    Select,
    TableSkeletonComponent,
    FieldErrorComponent,
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
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);

  readonly rows = signal<BranchListRow[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly status = signal<string>('active');

  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly createVisible = signal(false);
  readonly editVisible = signal(false);
  readonly editTarget = signal<BranchListRow | null>(null);
  readonly savingCreate = signal(false);
  readonly savingEdit = signal(false);

  readonly menuItems = signal<MenuItem[]>([]);

  readonly branchForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    city: ['', Validators.required],
    country: ['', Validators.required],
    timezone: ['Asia/Karachi', Validators.required],
    active: [true],
  });

  // Building Management
  readonly buildingCreateVisible = signal(false);
  readonly buildingEditVisible = signal(false);
  readonly buildingEditTarget = signal<BuildingListRow | null>(null);
  readonly buildingTargetBranch = signal<BranchListRow | null>(null);
  readonly savingBuilding = signal(false);
  readonly buildingMenuItems = signal<MenuItem[]>([]);

  readonly buildingForm = this.fb.group({
    name: ['', Validators.required],
  });

  constructor() {
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

  onRowExpand(event: { data: BranchListRow }): void {
    const branch = event.data;
    if (branch.buildings) return;

    this.buildingsApi.list(1, 100, this.status(), branch._id).subscribe({
      next: ({ items }) => {
        this.rows.update((rows) =>
          rows.map((r) => (r._id === branch._id ? { ...r, buildings: items } : r))
        );
      },
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
    this.branchForm.reset({
      name: '',
      code: '',
      city: '',
      country: '',
      timezone: 'Asia/Karachi',
      active: true,
    });
    this.createVisible.set(true);
  }

  submitCreate(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const body = this.branchForm.getRawValue();
    // Delete code from body if it's empty (backend will generate)
    if (!body.code) delete (body as any).code;

    this.savingCreate.set(true);
    this.api.create(body as any).subscribe({
      next: (res) => {
        this.messages.add({ severity: 'success', summary: 'Branch created', detail: res.name });
        this.createVisible.set(false);
        this.reload();
      },
      complete: () => this.savingCreate.set(false),
    });
  }

  openEdit(row: BranchListRow): void {
    this.editTarget.set(row);
    this.branchForm.reset({
      name: row.name,
      code: row.code,
      city: row.city,
      country: row.country,
      timezone: row.timezone,
      active: row.active,
    });
    this.editVisible.set(true);
  }

  submitEdit(): void {
    const row = this.editTarget();
    if (!row) return;
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const body = this.branchForm.getRawValue() as BranchUpdateRequest;
    this.savingEdit.set(true);
    this.api.update(branchRowId(row), body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Branch details saved.' });
        this.editVisible.set(false);
        this.editTarget.set(null);
        this.reload();
      },
      complete: () => this.savingEdit.set(false),
    });
  }

  onDelete(row: BranchListRow): void {
    this.confirmation.confirm({
      message: `Are you sure you want to deactivate ${row.name}?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(branchRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deactivated', detail: 'Branch marked as inactive.' });
            this.reload();
          },
          error: (err) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Could not deactivate branch.' });
          }
        });
      },
    });
  }

  onRestore(row: BranchListRow): void {
    this.api.restore(branchRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Restored', detail: 'Branch is now active again.' });
        this.reload();
      },
    });
  }

  onPermanentDelete(row: BranchListRow): void {
    this.confirmation.confirm({
      message: `PERMANENT DELETE: This will completely remove ${row.name} from the database. This action cannot be undone. Proceed?`,
      header: 'PERMANENT DELETE',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deletePermanent(branchRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Permanently Deleted', detail: 'Branch removed from system.' });
            this.reload();
          },
          error: (err) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Could not delete branch permanently.' });
          }
        });
      },
    });
  }

  isAuthorizedForPermanentDelete(): boolean {
    return this.auth.hasAnyRole(['super_admin', 'admin']);
  }

  prepareActions(event: Event, row: BranchListRow, menu: any): void {
    const items: MenuItem[] = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEdit(row),
      },
    ];

    if (row.deletedAt || !row.active) {
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

  // --- Building Methods ---
  openCreateBuilding(branch: BranchListRow): void {
    this.buildingTargetBranch.set(branch);
    this.buildingForm.reset({ name: '' });
    this.buildingCreateVisible.set(true);
  }

  submitCreateBuilding(): void {
    const branch = this.buildingTargetBranch();
    if (!branch || this.buildingForm.invalid) {
      if (this.buildingForm.invalid) this.buildingForm.markAllAsTouched();
      return;
    }

    this.savingBuilding.set(true);
    this.buildingsApi.create({
      branchId: branch._id,
      name: this.buildingForm.getRawValue().name!,
    }).subscribe({
      next: (res) => {
        this.messages.add({ severity: 'success', summary: 'Building created', detail: res.name });
        this.buildingCreateVisible.set(false);
        this.reloadBuildings(branch._id);
      },
      complete: () => this.savingBuilding.set(false),
    });
  }

  openEditBuilding(building: BuildingListRow, branch: BranchListRow): void {
    this.buildingEditTarget.set(building);
    this.buildingTargetBranch.set(branch);
    this.buildingForm.reset({ name: building.name });
    this.buildingEditVisible.set(true);
  }

  submitEditBuilding(): void {
    const building = this.buildingEditTarget();
    const branch = this.buildingTargetBranch();
    if (!building || !branch || this.buildingForm.invalid) {
      if (this.buildingForm.invalid) this.buildingForm.markAllAsTouched();
      return;
    }

    this.savingBuilding.set(true);
    this.buildingsApi.update(buildingRowId(building), {
      name: this.buildingForm.getRawValue().name!,
    }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Building updated.' });
        this.buildingEditVisible.set(false);
        this.reloadBuildings(branch._id);
      },
      complete: () => this.savingBuilding.set(false),
    });
  }

  onDeleteBuilding(building: BuildingListRow, branchId: string): void {
    this.confirmation.confirm({
      message: `Are you sure you want to deactivate ${building.name}?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.buildingsApi.delete(buildingRowId(building)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deactivated', detail: 'Building marked as inactive.' });
            this.reloadBuildings(branchId);
          },
          error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to deactivate.' })
        });
      },
    });
  }

  onRestoreBuilding(building: BuildingListRow, branchId: string): void {
    this.buildingsApi.restore(buildingRowId(building)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Restored', detail: 'Building is now active.' });
        this.reloadBuildings(branchId);
      },
    });
  }

  reloadBuildings(branchId: string): void {
    this.buildingsApi.list(1, 100, this.status(), branchId).subscribe({
      next: ({ items }) => {
        this.rows.update((rows) =>
          rows.map((r) => (r._id === branchId ? { ...r, buildings: items } : r))
        );
      },
    });
  }

  navigateToFloors(buildingId: string): void {
    this.router.navigate(['/property/buildings', buildingId, 'floors']);
  }

  prepareBuildingActions(event: Event, building: BuildingListRow, branch: BranchListRow, menu: any): void {
    const items: MenuItem[] = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEditBuilding(building, branch),
      },
    ];

    if (building.deletedAt || building.status === 'inactive') {
      items.push({
        label: 'Restore',
        icon: 'pi pi-refresh',
        command: () => this.onRestoreBuilding(building, branch._id),
      });
    } else {
      items.push({
        label: 'Deactivate',
        icon: 'pi pi-trash',
        command: () => this.onDeleteBuilding(building, branch._id),
      });
    }

    this.buildingMenuItems.set(items);
    menu.toggle(event);
  }
}
