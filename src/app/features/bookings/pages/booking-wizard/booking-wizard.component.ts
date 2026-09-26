import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { FileUpload, type FileSelectEvent } from 'primeng/fileupload';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type { BookingAccommodationType, BookingDocument } from '../../../../core/models/booking.model';
import type { BuildingListRow } from '../../../../core/models/building-admin.model';
import type { FloorListRow } from '../../../../core/models/floor-admin.model';
import type { Guest } from '../../../../core/models/guest.model';
import type { RoomTypeRow } from '../../../../core/models/room-type-admin.model';
import {
  unitStatusSeverity,
  type AmenityRow,
  type PrivateRoomRow,
  type PublicHallRow,
  type UnitStatus,
} from '../../../../core/models/unit-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AmenitiesApiService } from '../../../amenities/services/amenities-api.service';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { HallsApiService } from '../../../halls/services/halls-api.service';
import { RoomsApiService } from '../../../rooms/services/rooms-api.service';
import { RoomTypesApiService } from '../../../rooms/services/room-types-api.service';
import { GuestPickerComponent } from '../../../../shared/guest-picker/guest-picker.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';

/**
 * 'available' — bookable by anyone.
 * 'capacity-warning' — the unit's own status/dates are fine, it's just short on
 *   capacity for the requested party; a soft, policy-level block that an admin can
 *   override (e.g. squeezing in an extra guest), unlike a real occupied/maintenance
 *   room which nobody can select.
 * 'blocked' — status isn't available or there's a real date conflict; never selectable.
 */
type UnitBlockLevel = 'available' | 'capacity-warning' | 'blocked';

interface WizardUnit {
  id: string;
  code: string;
  detail: string;
  level: UnitBlockLevel;
  message?: string;
  /** The unit's real operational status (independent of `level`, which also folds in the
   *  date-range/capacity checks) — drives the status badge's color. */
  status: UnitStatus;
  statusLabel: string;
  statusSeverity: 'success' | 'info' | 'warn' | 'danger';
  typeLabel: string;
  locationLabel: string;
  capacityText: string;
  amenityNames: string[];
}

const STATUS_LABELS: Record<UnitStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

interface FilterOption {
  label: string;
  value: string | undefined;
}

const UNAVAILABLE_REASON_LABELS: Record<string, string> = {
  booked: 'Already booked for these dates',
  occupied: 'Currently occupied',
  cleaning: 'Being cleaned',
  maintenance: 'Under maintenance',
};

/** Only these roles may select a capacity-short unit; everyone else sees it as blocked too. */
const CAPACITY_OVERRIDE_ROLES = ['super_admin', 'admin'] as const;

const STEPS = ['Guest & Stay Details', 'Room Selection', 'Confirmation'];

@Component({
  selector: 'app-booking-wizard',
  imports: [
    FormsModule,
    Card,
    PageHeaderComponent,
    GuestPickerComponent,
    Button,
    Select,
    SelectButton,
    InputNumber,
    Textarea,
    DatePicker,
    FileUpload,
    ToggleSwitch,
  ],
  templateUrl: './booking-wizard.component.html',
  styleUrl: './booking-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingWizardComponent implements OnDestroy {
  private readonly branchesApi = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly hallsApi = inject(HallsApiService);
  private readonly roomTypesApi = inject(RoomTypesApiService);
  private readonly amenitiesApi = inject(AmenitiesApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly drawer = inject(BookingDetailDrawerService);

  readonly canOverrideCapacity = computed(() => this.auth.hasAnyRole(CAPACITY_OVERRIDE_ROLES));

  readonly steps = STEPS;
  readonly step = signal(1);

  readonly guestPicker = viewChild(GuestPickerComponent);

  readonly accommodationOptions = [
    { label: 'Private room', value: 'room' as BookingAccommodationType },
    { label: 'Public hall', value: 'hall' as BookingAccommodationType },
  ];

  // Step 1 — guest & stay details
  readonly guest = signal<Guest | null>(null);
  readonly notes = signal('');
  readonly committingGuest = signal(false);

  readonly bookingType = signal<BookingAccommodationType>('room');
  readonly branches = signal<BranchListRow[]>([]);
  /** Buildings under the selected branch — used by step 2's building filter. */
  readonly buildings = signal<BuildingListRow[]>([]);
  /** Every floor across every building in the branch — filtered client-side per the step 2 building/floor pickers. */
  readonly allFloors = signal<FloorListRow[]>([]);
  /** Room types for the selected branch — used to label room cards (e.g. "Deluxe Double"). */
  readonly roomTypes = signal<RoomTypeRow[]>([]);
  /** All amenities — used to label room/hall amenity chips. */
  readonly amenities = signal<AmenityRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly checkInDate = signal<Date | null>(null);
  readonly checkOutDate = signal<Date | null>(null);
  /** Midnight today — the floor for the check-in picker, computed once (the wizard is a
   *  single-sitting flow, so "today" doesn't need to be reactive). */
  readonly minCheckInDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  /** Checkout must be strictly after check-in — the day after whatever's picked (or today,
   *  before a check-in date is chosen). */
  readonly minCheckOutDate = computed(() => {
    const base = this.checkInDate() ?? this.minCheckInDate;
    const next = new Date(base);
    next.setDate(next.getDate() + 1);
    return next;
  });
  readonly adults = signal(2);
  readonly children = signal(0);
  readonly partySize = signal(1);
  /** Only meaningful when the check-in date is today — see `isCheckInToday`. */
  readonly checkInNow = signal(false);

  /** Walk-in check-in only makes sense for a check-in date of today; a future-dated
   *  reservation can't be "checked in immediately" yet. */
  readonly isCheckInToday = computed(() => {
    const d = this.checkInDate();
    if (!d) return false;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });

  constructor() {
    this.branchesApi.list(1, 100, 'active').subscribe({ next: ({ items }) => this.branches.set(items) });
    this.amenitiesApi.list().subscribe({ next: ({ items }) => this.amenities.set(items) });
    // The walk-in toggle only applies to a today check-in — silently uncheck it the moment
    // the date moves away from today, so a stale "check in immediately" can't sneak into a
    // future-dated reservation.
    effect(() => {
      if (!this.isCheckInToday() && this.checkInNow()) this.checkInNow.set(false);
    });
    // Keep an already-picked checkout date honest whenever check-in moves past it — clear it
    // rather than silently submitting a stale, now-invalid range.
    effect(() => {
      const checkOut = this.checkOutDate();
      if (checkOut && checkOut < this.minCheckOutDate()) this.checkOutDate.set(null);
    });
  }

  // Step 2 — room selection
  readonly searching = signal(false);
  readonly roomResults = signal<PrivateRoomRow[]>([]);
  readonly hallResults = signal<PublicHallRow[]>([]);
  readonly selectedUnitId = signal<string | undefined>(undefined);
  readonly filterBuildingId = signal<string | undefined>(undefined);
  readonly filterFloorId = signal<string | undefined>(undefined);

  readonly buildingFilterOptions = computed<FilterOption[]>(() => [
    { label: 'All buildings', value: undefined },
    ...this.buildings().map((b) => ({ label: b.name, value: b._id })),
  ]);

  readonly floorFilterOptions = computed<FilterOption[]>(() => {
    const buildingId = this.filterBuildingId();
    const floors = buildingId ? this.allFloors().filter((f) => f.buildingId === buildingId) : this.allFloors();
    return [{ label: 'All floors', value: undefined }, ...floors.map((f) => ({ label: f.label, value: f._id }))];
  });

  /** roomResults/hallResults narrowed to the chosen building/floor — recomputed client-side, no refetch. */
  readonly filteredRoomResults = computed(() => {
    const buildingId = this.filterBuildingId();
    const floorId = this.filterFloorId();
    return this.roomResults().filter(
      (r) => (!buildingId || r.buildingId === buildingId) && (!floorId || r.floorId === floorId),
    );
  });

  readonly filteredHallResults = computed(() => {
    const buildingId = this.filterBuildingId();
    const floorId = this.filterFloorId();
    return this.hallResults().filter(
      (h) => (!buildingId || h.buildingId === buildingId) && (!floorId || h.floorId === floorId),
    );
  });

  /** Every room/hall matching the current building/floor filter. A unit with a real status/date
   * conflict is always 'blocked'; one that's genuinely free but just short on capacity is only a
   * 'capacity-warning' — a policy call, not a physical one — so it stays selectable for admins
   * while still being flagged and blocked for everyone else. */
  readonly wizardUnits = computed<WizardUnit[]>(() => {
    let units: WizardUnit[];
    if (this.bookingType() === 'room') {
      const needed = this.adults() + this.children();
      units = this.filteredRoomResults().map((r) => {
        const statusBlocked = r.availableForRange === false;
        const capacityShort = r.capacity.total < needed;
        let level: UnitBlockLevel;
        let message: string | undefined;
        if (statusBlocked) {
          level = 'blocked';
          message = r.unavailableReason ? UNAVAILABLE_REASON_LABELS[r.unavailableReason] ?? 'Unavailable' : 'Unavailable';
        } else if (capacityShort) {
          level = 'capacity-warning';
          message = `Fits up to ${r.capacity.total} guests — ${needed} requested`;
        } else {
          level = 'available';
        }
        return {
          id: r._id,
          code: r.code,
          detail: `Capacity ${r.capacity.total}`,
          level,
          message,
          status: r.status,
          statusLabel: STATUS_LABELS[r.status],
          statusSeverity: unitStatusSeverity(r.status),
          typeLabel: this.roomTypeName(r.roomTypeId),
          locationLabel: this.locationLabel(r.buildingId, r.floorId),
          capacityText: `${r.capacity.adults} adult${r.capacity.adults === 1 ? '' : 's'}${r.capacity.children ? `, ${r.capacity.children} child${r.capacity.children === 1 ? '' : 'ren'}` : ''}`,
          amenityNames: this.amenityNamesFor(r.amenityIds),
        };
      });
    } else {
      const remaining = (h: PublicHallRow) => h.rangeOccupancy?.remaining ?? h.occupancy?.remaining ?? h.maxCapacity;
      units = this.filteredHallResults().map((h) => {
        const statusBlocked = h.status !== 'available';
        const capacityShort = remaining(h) < this.partySize();
        let level: UnitBlockLevel;
        let message: string | undefined;
        if (statusBlocked) {
          level = 'blocked';
          message = UNAVAILABLE_REASON_LABELS[h.status] ?? 'Unavailable';
        } else if (capacityShort) {
          level = 'capacity-warning';
          message = `Only ${remaining(h)} of ${h.maxCapacity} spots left — ${this.partySize()} requested`;
        } else {
          level = 'available';
        }
        return {
          id: h._id,
          code: h.code,
          detail: `${remaining(h)} of ${h.maxCapacity} spots available`,
          level,
          message,
          status: h.status,
          statusLabel: STATUS_LABELS[h.status],
          statusSeverity: unitStatusSeverity(h.status),
          typeLabel: 'Public hall',
          locationLabel: this.locationLabel(h.buildingId, h.floorId),
          capacityText: `Up to ${h.maxCapacity} guests`,
          amenityNames: this.amenityNamesFor(h.amenityIds),
        };
      });
    }
    const rank = (u: WizardUnit) => (u.level === 'available' ? 0 : u.level === 'capacity-warning' ? 1 : 2);
    return [...units].sort((a, b) => rank(a) - rank(b));
  });

  readonly availableCount = computed(() => this.wizardUnits().filter((u) => u.level === 'available').length);

  /** A capacity-warning unit is selectable only for admins; a blocked one never is. */
  isSelectable(unit: WizardUnit): boolean {
    if (unit.level === 'blocked') return false;
    if (unit.level === 'capacity-warning') return this.canOverrideCapacity();
    return true;
  }

  // Step 3 — confirmation
  readonly creating = signal(false);
  readonly createdBookingNumber = signal<string | null>(null);
  readonly createdBookingId = signal<string | null>(null);

  /** Documents attached to the just-created booking — optional, never blocks finishing the wizard. */
  readonly bookingDocuments = signal<BookingDocument[]>([]);
  readonly uploadingDocuments = signal(false);
  readonly maxDocumentSize = 5 * 1024 * 1024;
  readonly documentAccept = 'image/*,application/pdf';
  private readonly documentFileUpload = viewChild<FileUpload>('documentFileUpload');
  private readonly objectUrls = new Set<string>();

  onBranchChange(branchId: string | null): void {
    this.branchId.set(branchId ?? undefined);
    this.buildings.set([]);
    this.allFloors.set([]);
    this.roomTypes.set([]);
    this.filterBuildingId.set(undefined);
    this.filterFloorId.set(undefined);
    if (branchId) {
      this.buildingsApi.list(1, 100, 'active', branchId).subscribe({
        next: ({ items }) => {
          this.buildings.set(items);
          this.loadAllFloors(items.map((b) => b._id));
        },
      });
      this.roomTypesApi.list(branchId).subscribe({ next: ({ items }) => this.roomTypes.set(items) });
    }
  }

  private roomTypeName(id: string): string {
    return this.roomTypes().find((t) => t._id === id)?.name ?? 'Room';
  }

  private buildingName(id: string | null | undefined): string | null {
    return id ? (this.buildings().find((b) => b._id === id)?.name ?? null) : null;
  }

  private floorLabel(id: string | null | undefined): string | null {
    return id ? (this.allFloors().find((f) => f._id === id)?.label ?? null) : null;
  }

  private locationLabel(buildingId: string | null | undefined, floorId: string | null | undefined): string {
    const parts = [this.buildingName(buildingId), this.floorLabel(floorId)].filter((p): p is string => !!p);
    return parts.length ? parts.join(' · ') : 'Location unassigned';
  }

  private amenityNamesFor(ids: string[]): string[] {
    const byId = this.amenities();
    return ids.map((id) => byId.find((a) => a._id === id)?.name).filter((n): n is string => !!n);
  }

  /** Fetches every floor across every building in the branch once, up front, so the step 2 building/floor
   * filters can just slice this list client-side instead of re-fetching on every filter change. */
  private loadAllFloors(buildingIds: string[]): void {
    if (!buildingIds.length) {
      this.allFloors.set([]);
      return;
    }
    forkJoin(buildingIds.map((id) => this.floorsApi.list(id, 1, 100, 'active'))).subscribe({
      next: (results) => this.allFloors.set(results.flatMap((r) => r.items)),
      error: () => this.allFloors.set([]),
    });
  }

  onFilterBuildingChange(buildingId: string | null): void {
    this.filterBuildingId.set(buildingId ?? undefined);
    this.filterFloorId.set(undefined);
  }

  onFilterFloorChange(floorId: string | null): void {
    this.filterFloorId.set(floorId ?? undefined);
  }

  /** Which part of the combined step-1 form is missing, for inline hints. */
  readonly step1Missing = computed(() => {
    const missing: string[] = [];
    const guestReady = !!this.guest() || !!this.guestPicker()?.hasPendingGuestInput();
    if (!guestReady) missing.push('a guest');
    if (!this.branchId()) missing.push('a branch');
    if (!this.checkInDate()) missing.push('a check-in date');
    if (!this.checkOutDate()) missing.push('a checkout date');
    const checkIn = this.checkInDate();
    const checkOut = this.checkOutDate();
    if (checkIn && checkOut && checkOut <= checkIn) missing.push('a checkout date after check-in');
    if (this.bookingType() === 'room' && this.adults() < 1) missing.push('at least 1 adult');
    if (this.bookingType() === 'hall' && this.partySize() < 1) missing.push('a party size');
    return missing;
  });

  canProceed(): boolean {
    if (this.committingGuest()) return false;
    switch (this.step()) {
      case 1:
        return this.step1Missing().length === 0;
      case 2:
        return !!this.selectedUnitId();
      default:
        return true;
    }
  }

  next(): void {
    if (this.step() === 1) {
      this.commitStep1();
      return;
    }
    if (!this.canProceed()) return;
    if (this.step() === 2) {
      this.submitBooking();
      return;
    }
    this.step.update((s) => Math.min(s + 1, STEPS.length));
  }

  /** Next from step 1: creates the pending new guest (if the drawer's open) and uploads any queued
   * documents to it, then validates the rest of step 1 before advancing and kicking off the search. */
  private commitStep1(): void {
    const picker = this.guestPicker();
    if (!picker) return;
    this.committingGuest.set(true);
    picker.commitPendingGuest().subscribe((guest) => {
      this.committingGuest.set(false);
      if (guest) this.guest.set(guest);
      if (this.step1Missing().length > 0) return;
      this.searchAvailability();
      this.step.update((s) => s + 1);
    });
  }

  back(): void {
    this.step.update((s) => Math.max(s - 1, 1));
  }

  searchAvailability(): void {
    const branchId = this.branchId();
    const checkInDate = this.checkInDate();
    const checkOutDate = this.checkOutDate();
    if (!branchId || !checkInDate || !checkOutDate) return;
    this.searching.set(true);
    // No status/floor filter here on purpose — every room/hall in the branch comes back so the
    // step 2 picker can show the whole branch and mark which ones are actually free for these
    // dates; the building/floor selects on that step then narrow the view client-side.
    const range = { checkInDate: checkInDate.toISOString(), expectedCheckOut: checkOutDate.toISOString() };
    if (this.bookingType() === 'room') {
      this.roomsApi.list({ branchId, ...range }).subscribe({
        next: ({ items }) => {
          this.roomResults.set(items);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
    } else {
      this.hallsApi.list({ branchId, ...range }).subscribe({
        next: ({ items }) => {
          this.hallResults.set(items);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
    }
  }

  selectUnit(unit: WizardUnit): void {
    if (!this.isSelectable(unit)) return;
    this.selectedUnitId.set(unit.id);
    if (unit.level === 'capacity-warning') {
      this.messages.add({
        severity: 'warn',
        summary: 'Capacity override',
        detail: `${unit.code}: ${unit.message}. Selected as an admin override.`,
      });
    }
  }

  private buildLine() {
    return {
      unitId: this.selectedUnitId()!,
      unitType: (this.bookingType() === 'room' ? 'private_room' : 'public_hall') as 'private_room' | 'public_hall',
      checkInDate: this.checkInDate()!.toISOString(),
      expectedCheckOut: this.checkOutDate()!.toISOString(),
      occupancy:
        this.bookingType() === 'room'
          ? { adults: this.adults(), children: this.children(), totalGuests: this.adults() + this.children() }
          : { partySize: this.partySize() },
      guestIds: [this.guest()!._id],
    };
  }

  submitBooking(): void {
    const guest = this.guest();
    const branchId = this.branchId();
    if (!guest || !branchId || !this.selectedUnitId()) return;
    this.creating.set(true);
    // Belt-and-braces alongside the effect that unchecks `checkInNow` when the date drifts
    // off today — a future-dated stay must never be submitted as a walk-in.
    const checkInNow = this.checkInNow() && this.isCheckInToday();
    this.bookingsApi
      .create({
        branchId,
        bookingType: this.bookingType(),
        source: checkInNow ? 'walk_in' : 'reservation',
        primaryGuestId: guest._id,
        notes: this.notes() || undefined,
        lines: [this.buildLine()],
        checkInNow,
      })
      .subscribe({
        next: ({ booking }) => {
          this.createdBookingNumber.set(booking.bookingNumber);
          this.createdBookingId.set(booking._id);
          this.bookingDocuments.set(booking.documents ?? []);
          this.creating.set(false);
          this.step.set(3);
        },
        error: (err) => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Booking failed' });
          this.creating.set(false);
        },
      });
  }

  goToBooking(): void {
    const id = this.createdBookingId();
    if (id) this.drawer.open(id);
  }

  startAnother(): void {
    void this.router.navigate(['/bookings/new']).then(() => window.location.reload());
  }

  onDocumentFilesSelected(event: FileSelectEvent): void {
    const bookingId = this.createdBookingId();
    const files = event.currentFiles;
    if (!bookingId || !files.length) return;
    this.uploadingDocuments.set(true);
    this.bookingsApi.uploadDocuments(bookingId, files).subscribe({
      next: (updated) => {
        this.bookingDocuments.set(updated.documents ?? []);
        this.documentFileUpload()?.clear();
        this.uploadingDocuments.set(false);
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Document upload failed' });
        this.documentFileUpload()?.clear();
        this.uploadingDocuments.set(false);
      },
    });
  }

  removeDocument(doc: BookingDocument): void {
    const bookingId = this.createdBookingId();
    if (!bookingId) return;
    this.bookingsApi.deleteDocument(bookingId, doc._id).subscribe({
      next: (updated) => this.bookingDocuments.set(updated.documents ?? []),
      error: (err) =>
        this.messages.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Could not remove document' }),
    });
  }

  /** Opens the document in a new tab via a blob URL — auth is header-based, so a plain <a href> can't be used. */
  viewDocument(doc: BookingDocument): void {
    const bookingId = this.createdBookingId();
    if (!bookingId) return;
    this.bookingsApi.downloadDocument(bookingId, doc._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.objectUrls.add(url);
        window.open(url, '_blank');
        setTimeout(() => this.revokeUrl(url), 60_000);
      },
      error: (err) =>
        this.messages.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Could not open document' }),
    });
  }

  private revokeUrl(url: string): void {
    if (this.objectUrls.delete(url)) URL.revokeObjectURL(url);
  }

  formatDocumentSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  documentIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'pi pi-image';
    if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
    return 'pi pi-file';
  }

  ngOnDestroy(): void {
    for (const url of this.objectUrls) URL.revokeObjectURL(url);
    this.objectUrls.clear();
  }
}
