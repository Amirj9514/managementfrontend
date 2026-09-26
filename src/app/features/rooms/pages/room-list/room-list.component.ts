import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type { BuildingListRow } from '../../../../core/models/building-admin.model';
import type { FloorListRow } from '../../../../core/models/floor-admin.model';
import {
  ROOM_TYPE_CATEGORY_OPTIONS,
  type RoomTypeRow,
} from '../../../../core/models/room-type-admin.model';
import {
  UNIT_STATUS_OPTIONS,
  unitStatusSeverity,
  type AmenityRow,
  type PrivateRoomRow,
  type UnitStatus,
} from '../../../../core/models/unit-admin.model';
import { AmenitiesApiService } from '../../../amenities/services/amenities-api.service';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { RoomTypesApiService } from '../../services/room-types-api.service';
import { RoomsApiService } from '../../services/rooms-api.service';

@Component({
  selector: 'app-room-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    Toolbar,
    Button,
    Select,
    SelectButton,
    Fluid,
    InputText,
    InputNumber,
    MultiSelect,
    Dialog,
    ConfirmDialog,
    FieldErrorComponent,
  ],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomListComponent {
  private readonly roomsApi = inject(RoomsApiService);
  private readonly roomTypesApi = inject(RoomTypesApiService);
  private readonly amenitiesApi = inject(AmenitiesApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);

  readonly statusOptions = UNIT_STATUS_OPTIONS;
  readonly categoryOptions = ROOM_TYPE_CATEGORY_OPTIONS;
  readonly viewOptions = [
    { label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
    { label: 'Table', value: 'table', icon: 'pi pi-list' },
  ];
  readonly statusSeverityMap = {
    available: 'success' as const,
    occupied: 'info' as const,
    cleaning: 'warn' as const,
    maintenance: 'danger' as const,
  };

  readonly view = signal<'grid' | 'table'>('grid');
  readonly branches = signal<BranchListRow[]>([]);
  readonly buildings = signal<BuildingListRow[]>([]);
  readonly floors = signal<FloorListRow[]>([]);
  readonly amenities = signal<AmenityRow[]>([]);
  readonly roomTypes = signal<RoomTypeRow[]>([]);

  readonly branchId = signal<string | undefined>(undefined);
  readonly buildingId = signal<string | undefined>(undefined);
  readonly floorId = signal<string | undefined>(undefined);
  readonly statusFilter = signal<UnitStatus | undefined>(undefined);

  readonly rows = signal<PrivateRoomRow[]>([]);
  readonly loading = signal(true);

  /** Set when arriving via a deep link (e.g. "view this room" from a booking) — once the
   *  matching row shows up in `rows()`, the effect below opens its read-only view dialog and
   *  clears this. */
  readonly pendingUnitId = signal<string | null>(null);

  readonly canCreate = computed(() => !!this.floorId());

  readonly formVisible = signal(false);
  readonly editTarget = signal<PrivateRoomRow | null>(null);
  readonly saving = signal(false);
  readonly isEdit = computed(() => this.editTarget() !== null);

  /** Read-only detail dialog — separate from the create/edit form above, so following a
   *  "view this room" link (e.g. from a booking) never lands an admin in an editable form
   *  by surprise. */
  readonly viewVisible = signal(false);
  readonly viewTarget = signal<PrivateRoomRow | null>(null);

  readonly typeMgmtVisible = signal(false);
  readonly savingType = signal(false);

  readonly form = this.fb.nonNullable.group({
    roomTypeId: ['', Validators.required],
    code: ['', Validators.required],
    capacityAdults: [2, [Validators.required, Validators.min(1)]],
    capacityChildren: [0, [Validators.min(0)]],
    capacityTotal: [2, [Validators.required, Validators.min(1)]],
    amenityIds: [[] as string[]],
    status: ['available' as UnitStatus],
  });

  readonly typeForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['single'],
    maxAdults: [2, [Validators.required, Validators.min(1)]],
    maxChildren: [0, [Validators.min(0)]],
    maxOccupancy: [2, [Validators.required, Validators.min(1)]],
    allowsShared: [false],
  });

  constructor() {
    this.branchesApi.list(1, 100, 'active').subscribe({ next: ({ items }) => this.branches.set(items) });
    this.amenitiesApi.list().subscribe({ next: ({ items }) => this.amenities.set(items) });

    // Deep link support: booking detail's "view room" link passes the room's own
    // branch/building/floor so the cascade can be driven straight to it.
    const qp = this.route.snapshot.queryParamMap;
    const qBranch = qp.get('branchId');
    const qUnit = qp.get('unitId');
    if (qUnit) this.pendingUnitId.set(qUnit);
    if (qBranch) {
      this.onBranchChange(qBranch);
      const qBuilding = qp.get('buildingId');
      if (qBuilding) this.onBuildingChange(qBuilding);
      const qFloor = qp.get('floorId');
      if (qFloor) this.onFloorChange(qFloor);
    }

    effect(() => {
      const id = this.pendingUnitId();
      if (!id) return;
      const row = this.rows().find((r) => r._id === id);
      if (row) {
        this.openView(row);
        this.pendingUnitId.set(null);
      }
    });
  }

  onBranchChange(branchId: string | null): void {
    this.branchId.set(branchId ?? undefined);
    this.buildingId.set(undefined);
    this.floorId.set(undefined);
    this.buildings.set([]);
    this.floors.set([]);
    this.rows.set([]);
    if (branchId) {
      this.buildingsApi.list(1, 100, 'active', branchId).subscribe({ next: ({ items }) => this.buildings.set(items) });
      this.roomTypesApi.list(branchId).subscribe({ next: ({ items }) => this.roomTypes.set(items) });
      this.reload();
    } else {
      this.loading.set(false);
    }
  }

  onBuildingChange(buildingId: string | null): void {
    this.buildingId.set(buildingId ?? undefined);
    this.floorId.set(undefined);
    this.floors.set([]);
    if (buildingId) {
      this.floorsApi.list(buildingId, 1, 100, 'active').subscribe({ next: ({ items }) => this.floors.set(items) });
    }
  }

  onFloorChange(floorId: string | null): void {
    this.floorId.set(floorId ?? undefined);
    this.reload();
  }

  onStatusFilterChange(status: UnitStatus | null): void {
    this.statusFilter.set(status ?? undefined);
    this.reload();
  }

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) {
      this.rows.set([]);
      return;
    }
    this.loading.set(true);
    this.roomsApi
      .list({ branchId, floorId: this.floorId(), status: this.statusFilter() })
      .subscribe({
        next: ({ items }) => {
          this.rows.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  roomTypeName(id: string): string {
    return this.roomTypes().find((t) => t._id === id)?.name ?? '—';
  }

  amenityNames(ids: string[]): string {
    if (!ids?.length) return '—';
    const names = ids.map((id) => this.amenities().find((a) => a._id === id)?.name).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  buildingName(id: string | null | undefined): string {
    return (id && this.buildings().find((b) => b._id === id)?.name) || '—';
  }

  floorLabel(id: string | null | undefined): string {
    return (id && this.floors().find((f) => f._id === id)?.label) || '—';
  }

  openView(row: PrivateRoomRow): void {
    this.viewTarget.set(row);
    this.viewVisible.set(true);
  }

  /** Switches the read-only view dialog into the editable form for the same room. */
  editFromView(): void {
    const row = this.viewTarget();
    if (!row) return;
    this.viewVisible.set(false);
    this.openEdit(row);
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({
      roomTypeId: '',
      code: '',
      capacityAdults: 2,
      capacityChildren: 0,
      capacityTotal: 2,
      amenityIds: [],
      status: 'available',
    });
    this.formVisible.set(true);
  }

  openEdit(row: PrivateRoomRow): void {
    this.editTarget.set(row);
    this.form.reset({
      roomTypeId: row.roomTypeId,
      code: row.code,
      capacityAdults: row.capacity.adults,
      capacityChildren: row.capacity.children,
      capacityTotal: row.capacity.total,
      amenityIds: row.amenityIds ?? [],
      status: row.status,
    });
    this.formVisible.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const target = this.editTarget();
    const payload = {
      floorId: target?.floorId ?? this.floorId()!,
      roomTypeId: v.roomTypeId!,
      code: v.code!,
      capacity: { adults: v.capacityAdults!, children: v.capacityChildren ?? 0, total: v.capacityTotal! },
      amenityIds: v.amenityIds ?? [],
      status: v.status ?? 'available',
    };
    this.saving.set(true);
    const req = target ? this.roomsApi.update(target._id, payload) : this.roomsApi.create(payload);
    req.subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: target ? 'Updated' : 'Created', detail: v.code ?? '' });
        this.formVisible.set(false);
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Save failed' }),
      complete: () => this.saving.set(false),
    });
  }

  quickSetStatus(row: PrivateRoomRow, status: UnitStatus): void {
    this.roomsApi.setStatus(row._id, status).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Status updated', detail: `${row.code} is now ${status}` });
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Update failed' }),
    });
  }

  remove(row: PrivateRoomRow): void {
    this.confirmation.confirm({
      message: `Deactivate room "${row.code}"?`,
      header: 'Confirm deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.roomsApi.delete(row._id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deactivated', detail: row.code });
            this.reload();
          },
          error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Deactivation failed' }),
        });
      },
    });
  }

  openTypeMgmt(): void {
    this.typeForm.reset({ name: '', category: 'single', maxAdults: 2, maxChildren: 0, maxOccupancy: 2, allowsShared: false });
    this.typeMgmtVisible.set(true);
  }

  submitType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const branchId = this.branchId();
    const v = this.typeForm.getRawValue();
    this.savingType.set(true);
    this.roomTypesApi
      .create({
        branchId,
        name: v.name!,
        category: v.category as RoomTypeRow['category'],
        maxAdults: v.maxAdults!,
        maxChildren: v.maxChildren ?? 0,
        maxOccupancy: v.maxOccupancy!,
        allowsShared: v.allowsShared ?? false,
      })
      .subscribe({
        next: (created) => {
          this.messages.add({ severity: 'success', summary: 'Room type created', detail: created.name });
          this.roomTypes.update((rows) => [...rows, created]);
          this.typeForm.reset({ name: '', category: 'single', maxAdults: 2, maxChildren: 0, maxOccupancy: 2, allowsShared: false });
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Save failed' }),
        complete: () => this.savingType.set(false),
      });
  }

  toggleTypeEnabled(type: RoomTypeRow): void {
    const isActive = !type.deletedAt;
    const req = isActive ? this.roomTypesApi.delete(type._id) : this.roomTypesApi.restore(type._id);
    req.subscribe({
      next: () => {
        this.roomTypes.update((rows) =>
          rows.map((r) => (r._id === type._id ? { ...r, deletedAt: isActive ? new Date().toISOString() : null } : r)),
        );
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Update failed' }),
    });
  }

  severityFor(status: UnitStatus) {
    return unitStatusSeverity(status);
  }
}
