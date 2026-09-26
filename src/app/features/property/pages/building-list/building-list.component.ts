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
  buildingRowId,
  type BuildingCreateRequest,
  type BuildingListRow,
  type BuildingUpdateRequest,
} from '../../../../core/models/building-admin.model';
import {
  floorRowId,
  type FloorCreateRequest,
  type FloorListRow,
  type FloorUpdateRequest,
} from '../../../../core/models/floor-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BuildingsApiService } from '../../services/buildings-api.service';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { FloorsApiService } from '../../services/floors-api.service';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';

@Component({
  selector: 'app-building-list',
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
    FieldErrorComponent,
  ],
  templateUrl: './building-list.component.html',
  styleUrl: './building-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingListComponent {
  private readonly api = inject(BuildingsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<BuildingListRow[]>([]);
  readonly branches = signal<BranchListRow[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly status = signal<string>('active');
  readonly currentBranchId = signal<string | undefined>(undefined);

  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  // Building signals
  readonly createVisible = signal(false);
  readonly editVisible = signal(false);
  readonly editTarget = signal<BuildingListRow | null>(null);
  readonly savingCreate = signal(false);
  readonly savingEdit = signal(false);

  // Floor signals
  readonly floorCreateVisible = signal(false);
  readonly floorEditVisible = signal(false);
  readonly floorEditTarget = signal<FloorListRow | null>(null);
  readonly floorTargetBuilding = signal<BuildingListRow | null>(null);
  readonly savingFloorCreate = signal(false);
  readonly savingFloorEdit = signal(false);

  readonly menuItems = signal<MenuItem[]>([]);
  readonly floorMenuItems = signal<MenuItem[]>([]);

  readonly buildingForm = this.fb.group({
    branchId: ['', Validators.required],
    name: ['', Validators.required],
  });

  readonly floorForm = this.fb.group({
    label: ['', Validators.required],
  });

  constructor() {
    this.reload();
    this.loadBranches();
  }

  loadBranches(): void {
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => this.branches.set(items),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.api.list(this.page(), this.pageSize(), this.status(), this.currentBranchId()).subscribe({
      next: ({ items, pagination }) => {
        this.rows.set(items);
        this.totalRecords.set(pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onRowExpand(event: { data: BuildingListRow }): void {
    const building = event.data;
    if (building.floors) return;

    this.floorsApi.list(building._id, 1, 100, this.status()).subscribe({
      next: ({ items }) => {
        this.rows.update(rows => 
          rows.map(r => r._id === building._id ? { ...r, floors: items } : r)
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

  onBranchFilterChange(id: string | null): void {
    this.currentBranchId.set(id || undefined);
    this.page.set(1);
    this.reload();
  }

  onPaginatorChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    const nextPage = Math.floor(first / rows) + 1;
    this.page.set(nextPage);
    this.pageSize.set(rows);
    this.reload();
  }

  // --- Building Methods ---
  openCreate(): void {
    this.buildingForm.reset({
      branchId: this.currentBranchId() || '',
      name: '',
    });
    this.createVisible.set(true);
  }

  submitCreate(): void {
    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
      return;
    }
    const body = this.buildingForm.getRawValue() as BuildingCreateRequest;
    this.savingCreate.set(true);
    this.api.create(body).subscribe({
      next: (res) => {
        this.messages.add({ severity: 'success', summary: 'Building created', detail: res.name });
        this.createVisible.set(false);
        this.reload();
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Creation failed' });
      },
      complete: () => this.savingCreate.set(false),
    });
  }

  openEdit(row: BuildingListRow): void {
    this.editTarget.set(row);
    this.buildingForm.reset({
      branchId: row.branchId,
      name: row.name,
    });
    this.editVisible.set(true);
  }

  submitEdit(): void {
    const row = this.editTarget();
    if (!row) return;
    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
      return;
    }
    const body = this.buildingForm.getRawValue() as BuildingUpdateRequest;
    this.savingEdit.set(true);
    this.api.update(buildingRowId(row), body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Building details saved.' });
        this.editVisible.set(false);
        this.editTarget.set(null);
        this.reload();
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Update failed' });
      },
      complete: () => this.savingEdit.set(false),
    });
  }

  onDelete(row: BuildingListRow): void {
    this.confirmation.confirm({
      message: `Are you sure you want to deactivate ${row.name}?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(buildingRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deactivated', detail: 'Building marked as inactive.' });
            this.reload();
          },
          error: (err) => {
            // This is where the "Cannot delete building with linked floors" error will be caught
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Deactivation failed' });
          }
        });
      },
    });
  }

  onRestore(row: BuildingListRow): void {
    this.api.restore(buildingRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Restored', detail: 'Building is now active again.' });
        this.reload();
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Restoration failed' });
      }
    });
  }

  onPermanentDelete(row: BuildingListRow): void {
    this.confirmation.confirm({
      message: `PERMANENT DELETE: This will completely remove ${row.name} from the database. This action cannot be undone. Proceed?`,
      header: 'PERMANENT DELETE',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deletePermanent(buildingRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Permanently Deleted', detail: 'Building removed from system.' });
            this.reload();
          },
          error: (err) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Permanent deletion failed' });
          }
        });
      },
    });
  }

  // --- Floor Methods ---
  openCreateFloor(building: BuildingListRow): void {
    this.floorTargetBuilding.set(building);
    this.floorForm.reset({
      label: '',
    });
    this.floorCreateVisible.set(true);
  }

  submitCreateFloor(): void {
    const building = this.floorTargetBuilding();
    if (!building) return;

    if (this.floorForm.invalid) {
      this.floorForm.markAllAsTouched();
      return;
    }

    const body: FloorCreateRequest = {
      buildingId: building._id,
      label: this.floorForm.getRawValue().label!,
    };

    this.savingFloorCreate.set(true);
    this.floorsApi.create(body).subscribe({
      next: (res) => {
        this.messages.add({ severity: 'success', summary: 'Floor added', detail: res.label });
        this.floorCreateVisible.set(false);
        this.reloadFloors(building._id);
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Floor creation failed' });
      },
      complete: () => this.savingFloorCreate.set(false),
    });
  }

  reloadFloors(buildingId: string): void {
    this.floorsApi.list(buildingId, 1, 100, this.status()).subscribe({
      next: ({ items }) => {
        this.rows.update(rows => 
          rows.map(r => r._id === buildingId ? { ...r, floors: items } : r)
        );
      },
    });
  }

  openEditFloor(row: FloorListRow, buildingId: string): void {
    this.floorEditTarget.set(row);
    // Find building object to set target
    const b = this.rows().find(r => r._id === buildingId);
    if (b) this.floorTargetBuilding.set(b);

    this.floorForm.reset({
      label: row.label,
    });
    this.floorEditVisible.set(true);
  }

  submitEditFloor(): void {
    const row = this.floorEditTarget();
    const building = this.floorTargetBuilding();
    if (!row || !building) return;

    if (this.floorForm.invalid) {
      this.floorForm.markAllAsTouched();
      return;
    }

    const body: FloorUpdateRequest = {
      label: this.floorForm.getRawValue().label!,
    };

    this.savingFloorEdit.set(true);
    this.floorsApi.update(floorRowId(row), body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Floor details saved.' });
        this.floorEditVisible.set(false);
        this.floorEditTarget.set(null);
        this.reloadFloors(building._id);
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Update failed' });
      },
      complete: () => this.savingFloorEdit.set(false),
    });
  }

  onDeleteFloor(row: FloorListRow, buildingId: string): void {
    this.confirmation.confirm({
      message: `Are you sure you want to deactivate floor ${row.label}?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.floorsApi.delete(floorRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deactivated', detail: 'Floor marked as inactive.' });
            this.reloadFloors(buildingId);
          },
          error: (err) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Deactivation failed' });
          }
        });
      },
    });
  }

  onRestoreFloor(row: FloorListRow, buildingId: string): void {
    this.floorsApi.restore(floorRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Restored', detail: 'Floor is now active again.' });
        this.reloadFloors(buildingId);
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Restoration failed' });
      }
    });
  }

  onPermanentDeleteFloor(row: FloorListRow, buildingId: string): void {
    this.confirmation.confirm({
      message: `PERMANENT DELETE: This will completely remove floor ${row.label} from the database. Proceed?`,
      header: 'PERMANENT DELETE',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.floorsApi.deletePermanent(floorRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Permanently Deleted', detail: 'Floor removed.' });
            this.reloadFloors(buildingId);
          },
          error: (err) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Permanent deletion failed' });
          }
        });
      },
    });
  }

  // --- Helpers ---
  isAuthorizedForPermanentDelete(): boolean {
    return this.auth.hasAnyRole(['super_admin', 'admin']);
  }

  getBranchName(id: string): string {
    return this.branches().find(b => b._id === id)?.name || id;
  }

  prepareActions(event: Event, row: BuildingListRow, menu: any): void {
    const items: MenuItem[] = [
      {
        label: 'Add Floor',
        icon: 'pi pi-plus',
        command: () => this.openCreateFloor(row),
      },
      {
        label: 'Edit Building',
        icon: 'pi pi-pencil',
        command: () => this.openEdit(row),
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

  prepareFloorActions(event: Event, floor: FloorListRow, buildingId: string, menu: any): void {
    const items: MenuItem[] = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEditFloor(floor, buildingId),
      },
    ];

    if (floor.deletedAt || floor.status === 'inactive') {
      items.push({
        label: 'Restore',
        icon: 'pi pi-refresh',
        command: () => this.onRestoreFloor(floor, buildingId),
      });

      if (this.isAuthorizedForPermanentDelete()) {
        items.push({
          label: 'Delete Forever',
          icon: 'pi pi-trash',
          command: () => this.onPermanentDeleteFloor(floor, buildingId),
        });
      }
    } else {
      items.push({
        label: 'Deactivate',
        icon: 'pi pi-trash',
        command: () => this.onDeleteFloor(floor, buildingId),
      });
    }

    this.floorMenuItems.set(items);
    menu.toggle(event);
  }
}
