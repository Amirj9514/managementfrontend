import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
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
import type { BookingUnitRow } from '../../../../core/models/booking.model';
import type { FloorListRow } from '../../../../core/models/floor-admin.model';
import type { Guest } from '../../../../core/models/guest.model';
import {
  UNIT_STATUS_OPTIONS,
  type AmenityRow,
  type PublicHallRow,
  type UnitStatus, type HallAudience,
} from '../../../../core/models/unit-admin.model';
import { AmenitiesApiService } from '../../../amenities/services/amenities-api.service';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { BookingsApiService } from '../../../bookings/services/bookings-api.service';
import { CapacityGaugeComponent } from '../../../../shared/capacity-gauge/capacity-gauge.component';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { GuestPickerComponent } from '../../../../shared/guest-picker/guest-picker.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { HALLS_DICTIONARY } from '../../halls.dictionary';
import { HallsApiService } from '../../services/halls-api.service';

@Component({
  selector: 'app-hall-board',
  imports: [
    SelectButton,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    CapacityGaugeComponent,
    GuestPickerComponent,
    Toolbar,
    Button,
    Select,
    MultiSelect,
    Fluid,
    InputText,
    InputNumber,
    DatePicker,
    Dialog,
    ConfirmDialog,
    FieldErrorComponent,
    TranslatePipe,
  ],
  templateUrl: './hall-board.component.html',
  styleUrl: './hall-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HallBoardComponent {
  private readonly hallsApi = inject(HallsApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly amenitiesApi = inject(AmenitiesApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);

  readonly statusOptions = UNIT_STATUS_OPTIONS;
  readonly statusOptionsT = computed(() => {
    this.i18n.currentLang();
    return this.statusOptions.map((o) => ({ ...o, label: this.i18n.t(`status.${o.value}`) }));
  });

  readonly branches = signal<BranchListRow[]>([]);
  readonly buildings = signal<BuildingListRow[]>([]);
  readonly floors = signal<FloorListRow[]>([]);
  readonly amenities = signal<AmenityRow[]>([]);

  readonly branchId = signal<string | undefined>(undefined);
  readonly buildingId = signal<string | undefined>(undefined);
  readonly floorId = signal<string | undefined>(undefined);

  readonly halls = signal<PublicHallRow[]>([]);
  readonly loading = signal(true);
  readonly canCreate = computed(() => !!this.floorId());

  /** Set when arriving via a deep link (e.g. "view this hall" from a booking) — once the
   *  matching hall shows up in `halls()`, the effect below selects it and clears this. */
  readonly pendingUnitId = signal<string | null>(null);

  readonly selectedHallId = signal<string | undefined>(undefined);
  readonly selectedHall = computed(() => this.halls().find((h) => h._id === this.selectedHallId()));
  readonly parties = signal<{ current: BookingUnitRow[]; upcoming: BookingUnitRow[] }>({ current: [], upcoming: [] });
  readonly loadingParties = signal(false);

  readonly formVisible = signal(false);
  readonly editTarget = signal<PublicHallRow | null>(null);
  readonly saving = signal(false);
  readonly isEdit = computed(() => this.editTarget() !== null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    maxCapacity: [20, [Validators.required, Validators.min(1)]],
    audience: ['mixed' as HallAudience],
    amenityIds: [[] as string[]],
    status: ['available' as UnitStatus],
  });

  readonly audienceOptions = computed(() =>
    (['gents', 'ladies', 'mixed'] as HallAudience[]).map((value) => ({
      label: this.i18n.t(`hallAudience.${value}`),
      value,
    })),
  );

  readonly checkInVisible = signal(false);
  readonly checkInSaving = signal(false);
  readonly checkInGuest = signal<Guest | null>(null);
  readonly checkInForm = this.fb.nonNullable.group({
    partySize: [1, [Validators.required, Validators.min(1)]],
    expectedCheckOut: [null as Date | null, Validators.required],
    notes: [''],
  });

  constructor() {
    this.i18n.register(HALLS_DICTIONARY);
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        // Single-branch setup: there's nothing to choose, so start on it straight away.
        if (!this.branchId() && items.length) this.onBranchChange(items[0]._id);
      },
    });
    this.amenitiesApi.list().subscribe({ next: ({ items }) => this.amenities.set(items) });

    // Deep link support: booking detail's "view hall" link passes the hall's own
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
      const hall = this.halls().find((h) => h._id === id);
      if (hall) {
        this.selectHall(hall);
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
    this.halls.set([]);
    this.selectedHallId.set(undefined);
    if (branchId) {
      this.buildingsApi.list(1, 100, 'active', branchId).subscribe({ next: ({ items }) => this.buildings.set(items) });
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

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) {
      this.halls.set([]);
      return;
    }
    this.loading.set(true);
    this.hallsApi.list({ branchId, floorId: this.floorId() }).subscribe({
      next: ({ items }) => {
        this.halls.set(items);
        this.loading.set(false);
        if (!this.selectedHallId() && items.length) this.selectHall(items[0]);
      },
      error: () => this.loading.set(false),
    });
  }

  selectHall(hall: PublicHallRow): void {
    this.selectedHallId.set(hall._id);
    this.loadingParties.set(true);
    this.hallsApi.parties(hall._id).subscribe({
      next: (p) => {
        this.parties.set(p);
        this.loadingParties.set(false);
      },
      error: () => this.loadingParties.set(false),
    });
  }

  amenityNames(ids: string[]): string {
    if (!ids?.length) return '—';
    const names = ids.map((id) => this.amenities().find((a) => a._id === id)?.name).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({ code: '', maxCapacity: 20, audience: 'mixed', amenityIds: [], status: 'available' });
    this.formVisible.set(true);
  }

  openEdit(hall: PublicHallRow): void {
    this.editTarget.set(hall);
    this.form.reset({
      code: hall.code,
      maxCapacity: hall.maxCapacity,
      audience: hall.audience ?? 'mixed',
      amenityIds: hall.amenityIds ?? [],
      status: hall.status,
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
      code: v.code!,
      maxCapacity: v.maxCapacity!,
      audience: v.audience,
      amenityIds: v.amenityIds ?? [],
      status: v.status ?? 'available',
    };
    this.saving.set(true);
    const req = target ? this.hallsApi.update(target._id, payload) : this.hallsApi.create(payload);
    req.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t(target ? 'common.updated' : 'common.created'),
          detail: v.code ?? '',
        });
        this.formVisible.set(false);
        this.reload();
      },
      error: (err) =>
        this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail: err.message || this.i18n.t('halls.saveFailed') }),
      complete: () => this.saving.set(false),
    });
  }

  remove(hall: PublicHallRow): void {
    this.confirmation.confirm({
      message: this.i18n.t('halls.confirmDeactivate', { code: hall.code }),
      header: this.i18n.t('halls.confirmDeactivateHeader'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.hallsApi.delete(hall._id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('common.deactivated'), detail: hall.code });
            this.reload();
          },
          error: (err) =>
            this.messages.add({
              severity: 'error',
              summary: this.i18n.t('common.error'),
              detail: err.message || this.i18n.t('halls.deactivationFailed'),
            }),
        });
      },
    });
  }

  openGroupCheckIn(): void {
    this.checkInGuest.set(null);
    this.checkInForm.reset({ partySize: 1, expectedCheckOut: null, notes: '' });
    this.checkInVisible.set(true);
  }

  submitGroupCheckIn(): void {
    const hall = this.selectedHall();
    const guest = this.checkInGuest();
    const branchId = this.branchId();
    if (!hall || !branchId) return;
    if (!guest) {
      this.messages.add({
        severity: 'warn',
        summary: this.i18n.t('halls.guestRequired'),
        detail: this.i18n.t('halls.guestRequiredDetail'),
      });
      return;
    }
    if (this.checkInForm.invalid) {
      this.checkInForm.markAllAsTouched();
      return;
    }
    const v = this.checkInForm.getRawValue();
    this.checkInSaving.set(true);
    this.hallsApi
      .groupCheckIn(hall._id, {
        branchId,
        primaryGuestId: guest._id,
        guestIds: [guest._id],
        partySize: v.partySize!,
        expectedCheckOut: (v.expectedCheckOut as Date).toISOString(),
        notes: v.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.i18n.t('halls.checkedInSummary'),
            detail: this.i18n.t('halls.checkedInDetail', { size: v.partySize!, code: hall.code }),
          });
          this.checkInVisible.set(false);
          this.reload();
          this.selectHall(hall);
        },
        error: (err) =>
          this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail: err.message || this.i18n.t('halls.checkInFailed') }),
        complete: () => this.checkInSaving.set(false),
      });
  }

  checkOutParty(line: BookingUnitRow): void {
    this.confirmation.confirm({
      message: this.i18n.t('halls.confirmCheckOut', { size: line.occupancy.partySize ?? 0 }),
      header: this.i18n.t('halls.confirmCheckOutHeader'),
      icon: 'pi pi-sign-out',
      accept: () => {
        this.bookingsApi.checkOut(line.bookingId, line._id).subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: this.i18n.t('halls.checkedOutSummary'),
              detail: this.i18n.t('halls.checkedOutDetail'),
            });
            this.reload();
            const hall = this.selectedHall();
            if (hall) this.selectHall(hall);
          },
          error: (err) =>
            this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail: err.message || this.i18n.t('halls.checkOutFailed') }),
        });
      },
    });
  }
}
