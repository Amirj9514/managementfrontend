import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import {
  BOOKING_STATUS_SEVERITY,
  type BookingGuestSummary,
  type BookingUnitRow,
  type BookingWithLines,
} from '../../../../core/models/booking.model';
import type { BuildingListRow } from '../../../../core/models/building-admin.model';
import type { FloorListRow } from '../../../../core/models/floor-admin.model';
import type { RoomTypeRow } from '../../../../core/models/room-type-admin.model';
import type { PrivateRoomRow, PublicHallRow } from '../../../../core/models/unit-admin.model';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { RoomsApiService } from '../../../rooms/services/rooms-api.service';
import { RoomTypesApiService } from '../../../rooms/services/room-types-api.service';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';

/**
 * Reusable body for a single booking's detail view — check-in/out, cancel, extend, and
 * transfer. Used both by the routed `/bookings/:id` page (for deep links) and by the
 * booking-detail drawer (opened from the booking list, guest history, and the wizard's
 * confirmation step) so a booking can be inspected without leaving the current screen.
 */
@Component({
  selector: 'app-booking-detail-body',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    Card,
    StatusBadgeComponent,
    Button,
    Select,
    Fluid,
    InputText,
    DatePicker,
    Dialog,
    FieldErrorComponent,
  ],
  templateUrl: './booking-detail-body.component.html',
  styleUrl: './booking-detail-body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailBodyComponent {
  private readonly api = inject(BookingsApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly roomTypesApi = inject(RoomTypesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly drawerSvc = inject(BookingDetailDrawerService);

  /** The drawer reuses a single component instance across different bookings, so this is a
   *  required input (not a route param) and reloads are driven by an effect below rather
   *  than only once in the constructor. */
  readonly bookingId = input.required<string>();

  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly data = signal<BookingWithLines | null>(null);
  readonly loading = signal(true);

  /** Property context for resolving each line's room type / building / floor names —
   *  fetched once per booking's branch, same lookup pattern as the booking wizard. */
  readonly roomTypes = signal<RoomTypeRow[]>([]);
  readonly buildings = signal<BuildingListRow[]>([]);
  readonly floors = signal<FloorListRow[]>([]);

  readonly guestById = computed(() => new Map(this.data()?.guests.map((g) => [g._id, g]) ?? []));
  readonly unitById = computed(() => new Map(this.data()?.units.map((u) => [u._id, u]) ?? []));

  /** Primary guest first, then any additional guests on the booking. */
  readonly orderedGuests = computed<Array<BookingGuestSummary & { isPrimary: boolean }>>(() => {
    const d = this.data();
    if (!d) return [];
    const primaryId = d.booking.primaryGuestId;
    return d.guests
      .map((g) => ({ ...g, isPrimary: g._id === primaryId }))
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  });

  readonly extendVisible = signal(false);
  readonly extendTarget = signal<BookingUnitRow | null>(null);
  readonly extendDate = signal<Date | null>(null);
  readonly extendSaving = signal(false);

  readonly transferVisible = signal(false);
  readonly transferTarget = signal<BookingUnitRow | null>(null);
  readonly transferRooms = signal<PrivateRoomRow[]>([]);
  readonly transferForm = this.fb.nonNullable.group({ toUnitId: ['', Validators.required], reason: [''] });
  readonly transferSaving = signal(false);

  constructor() {
    // Reload whenever bookingId() changes — not just once — since the drawer swaps this
    // input across bookings without destroying/recreating the component.
    effect(() => {
      this.bookingId();
      this.reload();
    });
  }

  reload(): void {
    this.loading.set(true);
    this.api.getById(this.bookingId()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
        this.loadPropertyContext(data.booking.branchId);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Room type / building / floor names for whichever units this booking's lines reference —
   *  fetched once per reload rather than per line. */
  private loadPropertyContext(branchId: string): void {
    this.roomTypesApi.list(branchId).subscribe({ next: ({ items }) => this.roomTypes.set(items) });
    this.buildingsApi.list(1, 100, 'active', branchId).subscribe({
      next: ({ items }) => {
        this.buildings.set(items);
        if (!items.length) {
          this.floors.set([]);
          return;
        }
        forkJoin(items.map((b) => this.floorsApi.list(b._id, 1, 100, 'active'))).subscribe({
          next: (results) => this.floors.set(results.flatMap((r) => r.items)),
          error: () => this.floors.set([]),
        });
      },
      error: () => {
        this.buildings.set([]);
        this.floors.set([]);
      },
    });
  }

  roomTypeName(unit: PrivateRoomRow | PublicHallRow): string {
    if (unit.unitType !== 'private_room') return 'Public hall';
    return this.roomTypes().find((t) => t._id === unit.roomTypeId)?.name ?? 'Room';
  }

  locationLabel(unit: PrivateRoomRow | PublicHallRow): string {
    const building = unit.buildingId ? this.buildings().find((b) => b._id === unit.buildingId)?.name : null;
    const floor = unit.floorId ? this.floors().find((f) => f._id === unit.floorId)?.label : null;
    const parts = [building, floor].filter((p): p is string => !!p);
    return parts.length ? parts.join(' · ') : 'Location unassigned';
  }

  capacityText(unit: PrivateRoomRow | PublicHallRow): string {
    if (unit.unitType === 'private_room') {
      const c = unit.capacity;
      return `${c.adults} adult${c.adults === 1 ? '' : 's'}${c.children ? `, ${c.children} child${c.children === 1 ? '' : 'ren'}` : ''}`;
    }
    return `Up to ${unit.maxCapacity} guests`;
  }

  openGuest(guestId: string): void {
    // Close the drawer first — otherwise it stays open floating over the guest detail page
    // this navigation is about to land on. Harmless no-op when this body is rendered on the
    // routed /bookings/:id page instead of inside the drawer.
    this.drawerSvc.close();
    void this.router.navigate(['/guests', guestId]);
  }

  /** Jumps to the Rooms/Halls admin screen, pre-driven straight to this unit via query params
   *  (branch → building → floor cascade + the unit's own id) so it opens the same way a
   *  guest's name opens their guest detail page — a direct link, not a generic list. */
  openUnit(unit: PrivateRoomRow | PublicHallRow): void {
    this.drawerSvc.close();
    const path = unit.unitType === 'private_room' ? '/rooms' : '/halls';
    void this.router.navigate([path], {
      queryParams: {
        branchId: unit.branchId ?? undefined,
        buildingId: unit.buildingId ?? undefined,
        floorId: unit.floorId,
        unitId: unit._id,
      },
    });
  }

  checkIn(line: BookingUnitRow): void {
    this.api.checkIn(this.bookingId(), line._id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Checked in' });
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Check-in failed' }),
    });
  }

  checkOut(line: BookingUnitRow): void {
    this.api.checkOut(this.bookingId(), line._id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Checked out' });
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Check-out failed' }),
    });
  }

  cancelLine(line: BookingUnitRow): void {
    this.api.cancelUnit(this.bookingId(), line._id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Line cancelled' });
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Cancel failed' }),
    });
  }

  cancelWholeBooking(): void {
    this.api.cancelBooking(this.bookingId()).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Booking cancelled' });
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Cancel failed' }),
    });
  }

  openExtend(line: BookingUnitRow): void {
    this.extendTarget.set(line);
    this.extendDate.set(new Date(line.expectedCheckOut));
    this.extendVisible.set(true);
  }

  submitExtend(): void {
    const line = this.extendTarget();
    const date = this.extendDate();
    if (!line || !date) return;
    this.extendSaving.set(true);
    this.api.extend(this.bookingId(), line._id, date.toISOString()).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Extended' });
        this.extendVisible.set(false);
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Extension failed' }),
      complete: () => this.extendSaving.set(false),
    });
  }

  openTransfer(line: BookingUnitRow): void {
    this.transferTarget.set(line);
    this.transferForm.reset({ toUnitId: '', reason: '' });
    const branchId = this.data()?.booking.branchId;
    if (branchId) {
      this.roomsApi.list({ branchId, status: 'available' }).subscribe({ next: ({ items }) => this.transferRooms.set(items) });
    }
    this.transferVisible.set(true);
  }

  submitTransfer(): void {
    const line = this.transferTarget();
    if (!line || this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }
    const v = this.transferForm.getRawValue();
    this.transferSaving.set(true);
    this.api.transfer(this.bookingId(), line._id, v.toUnitId!, v.reason || undefined).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Transferred' });
        this.transferVisible.set(false);
        this.reload();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Transfer failed' }),
      complete: () => this.transferSaving.set(false),
    });
  }
}
