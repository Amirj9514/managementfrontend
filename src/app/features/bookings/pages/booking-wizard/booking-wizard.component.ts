import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { FileUpload, type FileSelectEvent } from 'primeng/fileupload';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Textarea } from 'primeng/textarea';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type {
  BookingAccommodationType,
  BookingCompanion,
  BookingDocument,
  CompanionIdType,
} from '../../../../core/models/booking.model';
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
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { AmenitiesApiService } from '../../../amenities/services/amenities-api.service';
import { AuthService } from '../../../../core/services/auth.service';
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
import { BOOKINGS_DICTIONARY } from '../../bookings.dictionary';

/**
 * 'available' — bookable by anyone.
 * 'capacity-warning' — the unit's own status/dates are fine, it's just short on
 *   capacity for the requested party; flagged so staff notice, but still selectable
 *   (extra bed, kids sharing…), unlike a real occupied/maintenance room which nobody can select.
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
  /** For the building / floor / type / amenity filters on the room step. */
  buildingId: string | null;
  floorId: string;
  roomTypeId: string | null;
  amenityIds: string[];
}

/** Only a real status/date conflict blocks a unit — a capacity-short one is still bookable. */
function isBookable(u: WizardUnit): boolean {
  return u.level !== 'blocked';
}

const STATUS_KEYS: Record<UnitStatus, string> = {
  available: 'status.available',
  occupied: 'status.occupied',
  cleaning: 'status.cleaning',
  maintenance: 'status.maintenance',
};

interface FilterOption {
  label: string;
  value: string | undefined;
}

const UNAVAILABLE_REASON_KEYS: Record<string, string> = {
  booked: 'bookings.reason.booked',
  occupied: 'bookings.reason.occupied',
  cleaning: 'bookings.reason.cleaning',
  maintenance: 'bookings.reason.maintenance',
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

const STEP_KEYS = [
  'bookings.wizard.step.guestInfo',
  'bookings.wizard.step.stayDetails',
  'bookings.wizard.step.roomSelection',
  'bookings.wizard.step.confirmation',
];

const RELATION_KEYS = [
  'spouse',
  'child',
  'parent',
  'sibling',
  'relative',
  'friend',
  'colleague',
  'driver',
  'other',
] as const;

/** Editable row on step 1 — trimmed to BookingCompanion on submit. */
interface CompanionDraft {
  fullName: string;
  idType: CompanionIdType;
  idNumber: string;
  relation: string | null;
}

const MAX_COMPANIONS = 20;

@Component({
  selector: 'app-booking-wizard',
  imports: [
    DatePipe,
    FormsModule,
    Card,
    PageHeaderComponent,
    GuestPickerComponent,
    Button,
    Select,
    SelectButton,
    InputNumber,
    InputText,
    MultiSelect,
    Checkbox,
    Textarea,
    DatePicker,
    FileUpload,
    TranslatePipe,
  ],
  templateUrl: './booking-wizard.component.html',
  styleUrl: './booking-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingWizardComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly hallsApi = inject(HallsApiService);
  private readonly roomTypesApi = inject(RoomTypesApiService);
  private readonly amenitiesApi = inject(AmenitiesApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly drawer = inject(BookingDetailDrawerService);
  readonly i18n = inject(TranslationService);


  readonly steps = computed(() => STEP_KEYS.map((k) => this.i18n.t(k)));
  readonly step = signal(1);

  readonly guestPicker = viewChild(GuestPickerComponent);

  readonly accommodationOptions = computed(() => [
    { label: this.i18n.t('bookings.accommodation.room'), value: 'room' as BookingAccommodationType },
    { label: this.i18n.t('bookings.accommodation.hall'), value: 'hall' as BookingAccommodationType },
  ]);

  // Step 1 — guest & stay details
  readonly guest = signal<Guest | null>(null);
  readonly notes = signal('');
  readonly referenceBy = signal('');
  readonly committingGuest = signal(false);
  /** After the user tries Next on step 1, show under-field errors for incomplete companions. */
  readonly step1Attempted = signal(false);

  /** People staying with the primary guest — the count input grows/shrinks this list, keeping
   *  whatever was already typed into the surviving rows. */
  readonly companions = signal<CompanionDraft[]>([]);
  readonly maxCompanions = MAX_COMPANIONS;
  readonly idTypeOptions = computed(() => [
    { label: this.i18n.t('common.cnic'), value: 'cnic' as CompanionIdType },
    { label: this.i18n.t('bookings.idType.passport'), value: 'passport' as CompanionIdType },
  ]);
  readonly relationOptions = computed(() =>
    RELATION_KEYS.map((k) => ({ label: this.i18n.t(`bookings.relation.${k}`), value: k })),
  );

  onCompanionCountChange(value: number | null): void {
    const count = Math.min(MAX_COMPANIONS, Math.max(0, Math.floor(value ?? 0)));
    const current = this.companions();
    if (count === current.length) return;
    this.companions.set(
      count < current.length
        ? current.slice(0, count)
        : [
            ...current,
            ...Array.from({ length: count - current.length }, () => ({
              fullName: '',
              idType: 'cnic' as CompanionIdType,
              idNumber: '',
              relation: null,
            })),
          ],
    );
  }

  updateCompanion(index: number, patch: Partial<CompanionDraft>): void {
    this.companions.update((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  onCompanionIdTypeChange(index: number, idType: CompanionIdType | null): void {
    if (idType) this.updateCompanion(index, { idType });
  }

  removeCompanion(index: number): void {
    this.companions.update((list) => list.filter((_, i) => i !== index));
  }

  private companionsPayload(): BookingCompanion[] | undefined {
    const list = this.companions()
      .filter((c) => c.fullName.trim())
      .map((c) => ({
        fullName: c.fullName.trim(),
        idType: c.idType,
        idNumber: c.idNumber.trim() || undefined,
        relation: c.relation ?? undefined,
      }));
    return list.length ? list : undefined;
  }

  relationLabel(value: string | null | undefined): string {
    return value ? this.i18n.t(`bookings.relation.${value}`) : '—';
  }

  readonly bookingType = signal<BookingAccommodationType>('room');
  /** Hall stays only — which hall the party goes to (gents and ladies halls are separate). */
  readonly hallAudience = signal<'gents' | 'ladies'>('gents');
  readonly hallAudienceOptions = computed(() => [
    { label: this.i18n.t('hallAudience.gents'), value: 'gents' as const, icon: 'pi pi-user' },
    { label: this.i18n.t('hallAudience.ladies'), value: 'ladies' as const, icon: 'pi pi-user' },
  ]);

  onHallAudienceChange(value: 'gents' | 'ladies' | null): void {
    if (!value || value === this.hallAudience()) return;
    this.hallAudience.set(value);
    // A hall picked for the other audience no longer applies.
    this.selectedUnitId.set(undefined);
  }
  readonly branches = signal<BranchListRow[]>([]);
  /** Buildings under the selected branch — used by step 2's building filter. */
  readonly buildings = signal<BuildingListRow[]>([]);
  /** Every floor across every building in the branch — filtered client-side per the step 2 building/floor pickers. */
  readonly allFloors = signal<FloorListRow[]>([]);
  /** Room types for the selected branch — used to label room cards (e.g. "Deluxe Double"). */
  readonly roomTypes = signal<RoomTypeRow[]>([]);
  /** All amenities — used to label room/hall amenity chips and as stay-service options. */
  readonly amenities = signal<AmenityRow[]>([]);
  /** Amenity IDs allowed/enabled for this stay (sent as booking.serviceIds). */
  readonly serviceIds = signal<string[]>([]);
  /** Who authorized the selected stay services — required when any service is selected. */
  readonly allowedBy = signal('');
  /** Active amenities for the selected branch (global + branch-scoped). */
  readonly stayServiceOptions = computed(() => this.amenities().filter((a) => a.active));
  readonly branchId = signal<string | undefined>(undefined);
  /** Midnight today — the floor for the check-in picker, computed once (the wizard is a
   *  single-sitting flow, so "today" doesn't need to be reactive). */
  readonly minCheckInDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  /** Staff only pick check-in + nights; the expected checkout sent to the backend is always
   *  derived (check-in + nights), so there's no separate checkout picker to keep in sync. */
  readonly nights = signal(1);
  readonly checkInDate = signal<Date | null>(new Date(this.minCheckInDate));
  readonly checkOutDate = computed<Date | null>(() => {
    const checkIn = this.checkInDate();
    return checkIn ? addDays(checkIn, this.nights()) : null;
  });
  /** Party size comes entirely from step 1 — the primary guest plus every accompanying guest —
   *  so stay details don't ask for it again. Companions marked as "child" count as children. */
  readonly partySize = computed(() => this.companions().length + 1);
  readonly children = computed(() => this.companions().filter((c) => c.relation === 'child').length);
  readonly adults = computed(() => Math.max(1, this.partySize() - this.children()));

  /** Confirming a stay that starts today checks the guest in on the spot; a future-dated one is
   *  saved as a reservation and checked in from the check-in details when they arrive. */
  /** Same-day stays are checked in on confirm only for users holding `checkout.checkin`. */
  readonly canCheckIn = computed(() => this.auth.can('checkout.checkin'));
  readonly autoCheckIn = computed(() => this.isCheckInToday() && this.canCheckIn());

  readonly isCheckInToday = computed(() => {
    const d = this.checkInDate();
    if (!d) return false;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });

  constructor() {
    this.i18n.register(BOOKINGS_DICTIONARY);
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        // Single-branch setup: never ask — select it so step 3 can load its rooms/halls.
        if (!this.branchId() && items.length) this.onBranchChange(items[0]._id);
      },
    });
  }

  onNightsChange(value: number | null): void {
    this.nights.set(Math.max(1, Math.floor(value ?? 1)));
  }

  // Step 2 — room selection
  readonly searching = signal(false);
  readonly roomResults = signal<PrivateRoomRow[]>([]);
  readonly hallResults = signal<PublicHallRow[]>([]);
  readonly selectedUnitId = signal<string | undefined>(undefined);
  // ---- Room step: choose a building, then a floor, then refine — only those units are listed.
  readonly filterBuildingId = signal<string | undefined>(undefined);
  /** undefined = every floor of the chosen building. */
  readonly filterFloorId = signal<string | undefined>(undefined);
  readonly filterAvailableOnly = signal(true);
  readonly filterFitsParty = signal(false);
  readonly filterTypeId = signal<string | undefined>(undefined);
  readonly filterAmenityIds = signal<string[]>([]);
  readonly filterSearch = signal('');
  /** Once the user picks a floor themselves we stop auto-picking one for them. */
  private floorTouched = false;

  /** A single building is chosen for you; with several, the user must pick one first. */
  readonly effectiveBuildingId = computed(
    () => this.filterBuildingId() ?? (this.buildings().length === 1 ? this.buildings()[0]._id : undefined),
  );
  readonly needsBuilding = computed(() => this.buildings().length > 1 && !this.filterBuildingId());

  readonly typeFilterOptions = computed(() => this.roomTypes().map((t) => ({ label: t.name, value: t._id })));
  readonly amenityFilterOptions = computed(() => this.amenities().filter((a) => a.active));

  readonly hasActiveFilters = computed(
    () =>
      !!this.filterSearch().trim() ||
      !!this.filterTypeId() ||
      this.filterAmenityIds().length > 0 ||
      this.filterFitsParty() ||
      !this.filterAvailableOnly(),
  );

  /** Every room/hall the search returned, mapped for display. A unit with a real status/date
   * conflict is always 'blocked'; one that's genuinely free but just short on capacity is only a
   * 'capacity-warning' — a policy call, not a physical one — so it stays selectable for anyone,
   * just flagged. */
  readonly allUnits = computed<WizardUnit[]>(() => {
    if (this.bookingType() === 'room') {
      const needed = this.adults() + this.children();
      return this.roomResults().map((r) => {
        const statusBlocked = r.availableForRange === false;
        const capacityShort = r.capacity.total < needed;
        let level: UnitBlockLevel;
        let message: string | undefined;
        if (statusBlocked) {
          level = 'blocked';
          message = this.i18n.t(
            r.unavailableReason ? UNAVAILABLE_REASON_KEYS[r.unavailableReason] ?? 'bookings.reason.unavailable' : 'bookings.reason.unavailable',
          );
        } else if (capacityShort) {
          level = 'capacity-warning';
          message = this.i18n.t('bookings.fitsUpTo', { total: r.capacity.total, needed });
        } else {
          level = 'available';
        }
        return {
          id: r._id,
          code: r.code,
          detail: this.i18n.t('bookings.capacityCount', { count: r.capacity.total }),
          level,
          message,
          status: r.status,
          statusLabel: this.i18n.t(STATUS_KEYS[r.status]),
          statusSeverity: unitStatusSeverity(r.status),
          typeLabel: this.roomTypeName(r.roomTypeId),
          locationLabel: this.locationLabel(r.buildingId, r.floorId),
          capacityText:
            `${r.capacity.adults} ${this.i18n.t('common.adults')}` +
            (r.capacity.children ? `, ${r.capacity.children} ${this.i18n.t('common.children')}` : ''),
          amenityNames: this.amenityNamesFor(r.amenityIds),
          buildingId: r.buildingId ?? null,
          floorId: r.floorId,
          roomTypeId: r.roomTypeId,
          amenityIds: r.amenityIds ?? [],
        };
      });
    }

    const remaining = (h: PublicHallRow) => h.rangeOccupancy?.remaining ?? h.occupancy?.remaining ?? h.maxCapacity;
    const audience = this.hallAudience();
    return this.hallResults()
      // A gents party only sees gents (or mixed) halls, and likewise for ladies.
      .filter((h) => !h.audience || h.audience === 'mixed' || h.audience === audience)
      .map((h) => {
        const statusBlocked = h.status !== 'available';
        const capacityShort = remaining(h) < this.partySize();
        let level: UnitBlockLevel;
        let message: string | undefined;
        if (statusBlocked) {
          level = 'blocked';
          message = this.i18n.t(UNAVAILABLE_REASON_KEYS[h.status] ?? 'bookings.reason.unavailable');
        } else if (capacityShort) {
          level = 'capacity-warning';
          message = this.i18n.t('bookings.spotsLeftRequested', {
            remaining: remaining(h),
            max: h.maxCapacity,
            needed: this.partySize(),
          });
        } else {
          level = 'available';
        }
        return {
          id: h._id,
          code: h.code,
          detail: this.i18n.t('bookings.spotsAvailable', { remaining: remaining(h), max: h.maxCapacity }),
          level,
          message,
          status: h.status,
          statusLabel: this.i18n.t(STATUS_KEYS[h.status]),
          statusSeverity: unitStatusSeverity(h.status),
          typeLabel:
            h.audience && h.audience !== 'mixed'
              ? `${this.i18n.t('bookings.publicHall')} · ${this.i18n.t('hallAudience.' + h.audience)}`
              : this.i18n.t('bookings.publicHall'),
          locationLabel: this.locationLabel(h.buildingId, h.floorId),
          capacityText: this.i18n.t('bookings.upToGuests', { count: h.maxCapacity }),
          amenityNames: this.amenityNamesFor(h.amenityIds),
          buildingId: h.buildingId ?? null,
          floorId: h.floorId,
          roomTypeId: null,
          amenityIds: h.amenityIds ?? [],
        };
      });
  });

  /** The chosen building's units after type / amenity / search / "fits my party" — but not floor, and
   * not "available only", so the floor chips and counts stay meaningful whatever floor is open. */
  readonly scopedBase = computed(() => {
    const building = this.effectiveBuildingId();
    const q = this.filterSearch().trim().toLowerCase();
    const type = this.filterTypeId();
    const amenities = this.filterAmenityIds();
    const fits = this.filterFitsParty();
    return this.allUnits().filter(
      (u) =>
        (!building || u.buildingId === building) &&
        (!fits || u.level === 'available') &&
        (!type || u.roomTypeId === type) &&
        amenities.every((id) => u.amenityIds.includes(id)) &&
        (!q || u.code.toLowerCase().includes(q)),
    );
  });

  /** Floor order for the chosen building (by sort order, then natural label order). */
  private readonly orderedFloors = computed(() =>
    [...this.allFloors()]
      .filter((f) => !this.effectiveBuildingId() || f.buildingId === this.effectiveBuildingId())
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label, undefined, { numeric: true })),
  );

  /** One chip per floor that has anything to show, with "free / total" for the current filters. */
  readonly floorChips = computed(() => {
    if (!this.effectiveBuildingId() && this.buildings().length > 0) return [];
    const base = this.scopedBase();
    return this.orderedFloors()
      .map((f) => {
        const inFloor = base.filter((u) => u.floorId === f._id);
        return { id: f._id, label: f.label, free: inFloor.filter(isBookable).length, total: inFloor.length };
      })
      .filter((c) => c.total > 0);
  });
  readonly allFloorsChip = computed(() => {
    const chips = this.floorChips();
    return { free: chips.reduce((n, c) => n + c.free, 0), total: chips.reduce((n, c) => n + c.total, 0) };
  });

  /** Building tiles on the first picker row: how many of its rooms/halls could take this stay. */
  readonly buildingCards = computed(() =>
    this.buildings().map((b) => {
      const inBuilding = this.allUnits().filter((u) => u.buildingId === b._id);
      return { id: b._id, name: b.name, free: inBuilding.filter(isBookable).length, total: inBuilding.length };
    }),
  );

  /** What the chosen floor (or every floor) holds, before "available only". */
  private readonly shownBase = computed(() => {
    const floor = this.filterFloorId();
    return floor ? this.scopedBase().filter((u) => u.floorId === floor) : this.scopedBase();
  });
  readonly shownFree = computed(() => this.shownBase().filter(isBookable).length);
  readonly shownTotal = computed(() => this.shownBase().length);

  /** The units actually listed: nothing until a building is chosen; bookable first. */
  readonly wizardUnits = computed<WizardUnit[]>(() => {
    if (this.needsBuilding()) return [];
    let list = this.shownBase();
    if (this.filterAvailableOnly()) list = list.filter(isBookable);
    const rank = (u: WizardUnit) => (u.level === 'available' ? 0 : u.level === 'capacity-warning' ? 1 : 2);
    return [...list].sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code, undefined, { numeric: true }));
  });

  /** Listed units grouped under their floor (a single group when one floor is open). */
  readonly unitGroups = computed(() => {
    const order = new Map(this.orderedFloors().map((f, i) => [f._id, i] as const));
    const groups = new Map<string, WizardUnit[]>();
    for (const u of this.wizardUnits()) groups.set(u.floorId, [...(groups.get(u.floorId) ?? []), u]);
    return [...groups.entries()]
      .sort(([a], [b]) => (order.get(a) ?? 999) - (order.get(b) ?? 999))
      .map(([floorId, units]) => ({ floorId, label: this.floorLabel(floorId) ?? '', units }));
  });

  /** The chosen unit stays selected when filters change — shown in a bar, flagged if currently hidden. */
  readonly selectedUnit = computed(() => this.allUnits().find((u) => u.id === this.selectedUnitId()) ?? null);
  readonly selectedHidden = computed(() => {
    const s = this.selectedUnit();
    return !!s && !this.wizardUnits().some((u) => u.id === s.id);
  });

  readonly availableCount = computed(() => this.shownBase().filter((u) => u.level === 'available').length);

  /** Only a real status/date conflict blocks a unit — a capacity-short one is still bookable. */
  isSelectable(unit: WizardUnit): boolean {
    return unit.level !== 'blocked';
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

  /** Files picked on step 1, before the check-in exists — held client-side and uploaded right
   *  after it's created, so staff can attach ID scans up front instead of only on step 3. */
  readonly pendingDocuments = signal<File[]>([]);

  onPendingFilesPicked(input: HTMLInputElement): void {
    const picked = Array.from(input.files ?? []);
    input.value = '';
    const accepted: File[] = [];
    for (const file of picked) {
      const typeOk = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!typeOk) continue;
      if (file.size > this.maxDocumentSize) {
        this.messages.add({
          severity: 'warn',
          summary: this.i18n.t('bookings.toast.documentUploadFailed'),
          detail: this.i18n.t('bookings.toast.fileTooLarge', { name: file.name }),
        });
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) this.pendingDocuments.update((files) => [...files, ...accepted]);
  }

  removePendingDocument(index: number): void {
    this.pendingDocuments.update((files) => files.filter((_, i) => i !== index));
  }

  /** Uploads the step-1 queue to the newly created check-in. A failure here never undoes the
   *  check-in — it just tells staff to re-attach on the confirmation step. */
  private uploadPendingDocuments(bookingId: string, done: () => void): void {
    const files = this.pendingDocuments();
    if (!files.length) {
      done();
      return;
    }
    this.bookingsApi.uploadDocuments(bookingId, files).subscribe({
      next: (updated) => {
        this.bookingDocuments.set(updated.documents ?? []);
        this.pendingDocuments.set([]);
        done();
      },
      error: () => {
        this.messages.add({
          severity: 'warn',
          summary: this.i18n.t('bookings.toast.documentUploadFailed'),
          detail: this.i18n.t('bookings.toast.pendingDocumentsFailed'),
          life: 8000,
        });
        this.pendingDocuments.set([]);
        done();
      },
    });
  }

  onBranchChange(branchId: string | null): void {
    this.branchId.set(branchId ?? undefined);
    this.buildings.set([]);
    this.allFloors.set([]);
    this.roomTypes.set([]);
    this.filterBuildingId.set(undefined);
    this.filterFloorId.set(undefined);
    this.floorTouched = false;
    this.clearUnitFilters();
    this.selectedUnitId.set(undefined);
    this.serviceIds.set([]);
    this.allowedBy.set('');
    if (branchId) {
      this.buildingsApi.list(1, 100, 'active', branchId).subscribe({
        next: ({ items }) => {
          this.buildings.set(items);
          this.loadAllFloors(items.map((b) => b._id));
        },
      });
      this.roomTypesApi.list(branchId).subscribe({ next: ({ items }) => this.roomTypes.set(items) });
      this.amenitiesApi.list(1, 100, branchId, true).subscribe({ next: ({ items }) => this.amenities.set(items) });
    } else {
      this.amenities.set([]);
    }
  }

  private roomTypeName(id: string): string {
    return this.roomTypes().find((t) => t._id === id)?.name ?? this.i18n.t('common.room');
  }

  private buildingName(id: string | null | undefined): string | null {
    return id ? (this.buildings().find((b) => b._id === id)?.name ?? null) : null;
  }

  private floorLabel(id: string | null | undefined): string | null {
    return id ? (this.allFloors().find((f) => f._id === id)?.label ?? null) : null;
  }

  private locationLabel(buildingId: string | null | undefined, floorId: string | null | undefined): string {
    const parts = [this.buildingName(buildingId), this.floorLabel(floorId)].filter((p): p is string => !!p);
    return parts.length ? parts.join(' · ') : this.i18n.t('bookings.locationUnassigned');
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

  /** Picking (or changing) the building resets the floor, then opens the first floor that has space. */
  onFilterBuildingChange(buildingId: string | null | undefined): void {
    this.filterBuildingId.set(buildingId ?? undefined);
    this.filterFloorId.set(undefined);
    this.floorTouched = false;
    this.applyDefaultFloor();
  }

  onFilterFloorChange(floorId: string | null | undefined): void {
    this.floorTouched = true;
    this.filterFloorId.set(floorId ?? undefined);
  }

  /** Opens the first floor with room for this stay, so the user sees one floor — not the whole branch. */
  private applyDefaultFloor(): void {
    if (this.floorTouched || this.filterFloorId() || this.searching() || !this.effectiveBuildingId()) return;
    const first = this.floorChips().find((c) => c.free > 0);
    if (first) this.filterFloorId.set(first.id);
  }

  /** Resets the refinements (not the building / floor, which have their own pickers). */
  clearUnitFilters(): void {
    this.filterSearch.set('');
    this.filterTypeId.set(undefined);
    this.filterAmenityIds.set([]);
    this.filterFitsParty.set(false);
    this.filterAvailableOnly.set(true);
  }

  clearSelectedUnit(): void {
    this.selectedUnitId.set(undefined);
  }

  /** Step 1 (guest information) — what's still missing, for the inline hint. */
  readonly guestStepMissing = computed(() => {
    const missing: string[] = [];
    const guestReady = !!this.guest() || !!this.guestPicker()?.hasPendingGuestInput();
    if (!guestReady) missing.push(this.i18n.t('bookings.missing.guest'));
    if (this.companions().some((c) => !c.fullName.trim())) missing.push(this.i18n.t('bookings.missing.companionNames'));
    return missing;
  });

  /** Step 2 (stay details) — what's still missing, for the inline hint. */
  readonly stayStepMissing = computed(() => {
    const missing: string[] = [];
    if (!this.branchId()) missing.push(this.i18n.t('bookings.missing.branch'));
    if (!this.checkInDate()) missing.push(this.i18n.t('bookings.missing.checkInDate'));
    if (this.serviceIds().length > 0 && !this.allowedBy().trim()) {
      missing.push(this.i18n.t('bookings.missing.allowedBy'));
    }
    return missing;
  });

  onServiceIdsChange(ids: string[] | null): void {
    const next = ids ?? [];
    this.serviceIds.set(next);
    if (!next.length) this.allowedBy.set('');
  }

  canProceed(): boolean {
    if (this.committingGuest()) return false;
    switch (this.step()) {
      case 1:
        return this.guestStepMissing().length === 0;
      case 2:
        return this.stayStepMissing().length === 0;
      case 3:
        return !!this.selectedUnitId();
      default:
        return true;
    }
  }

  next(): void {
    if (this.step() === 1) {
      this.commitGuestStep();
      return;
    }
    if (!this.canProceed()) return;
    if (this.step() === 2) {
      this.searchAvailability();
      this.step.set(3);
      return;
    }
    if (this.step() === 3) {
      this.submitBooking();
      return;
    }
    this.step.update((s) => Math.min(s + 1, STEP_KEYS.length));
  }

  /** Next from step 1: creates the pending new guest (if the picker's create form is open), then
   * advances to stay details once the guest step is complete. */
  private commitGuestStep(): void {
    this.step1Attempted.set(true);
    const picker = this.guestPicker();
    if (!picker) return;
    this.committingGuest.set(true);
    picker.commitPendingGuest().subscribe((guest) => {
      this.committingGuest.set(false);
      if (guest) this.guest.set(guest);
      if (this.guestStepMissing().length > 0) return;
      this.step1Attempted.set(false);
      this.step.set(2);
    });
  }

  companionNameMissing(index: number): boolean {
    if (!this.step1Attempted()) return false;
    const name = this.companions()[index]?.fullName?.trim() ?? '';
    return !name;
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
          this.applyDefaultFloor();
        },
        error: () => this.searching.set(false),
      });
    } else {
      this.hallsApi.list({ branchId, ...range }).subscribe({
        next: ({ items }) => {
          this.hallResults.set(items);
          this.searching.set(false);
          this.applyDefaultFloor();
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
        summary: this.i18n.t('bookings.toast.capacityOverride'),
        detail: this.i18n.t('bookings.toast.capacityOverrideDetail', { code: unit.code, message: unit.message ?? '' }),
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
    // No manual toggle: a stay starting today is checked in automatically on confirm — but only
    // when this user may check in; otherwise it is saved as a reservation for someone who can.
    const checkInNow = this.autoCheckIn();
    this.bookingsApi
      .create({
        branchId,
        bookingType: this.bookingType(),
        source: this.isCheckInToday() ? 'walk_in' : 'reservation',
        primaryGuestId: guest._id,
        serviceIds: this.serviceIds().length ? this.serviceIds() : undefined,
        allowedBy: this.serviceIds().length ? this.allowedBy().trim() : undefined,
        notes: this.notes() || undefined,
        referenceBy: this.referenceBy().trim() || undefined,
        companions: this.companionsPayload(),
        lines: [this.buildLine()],
        checkInNow,
      })
      .subscribe({
        next: ({ booking }) => {
          this.createdBookingNumber.set(booking.bookingNumber);
          this.createdBookingId.set(booking._id);
          this.bookingDocuments.set(booking.documents ?? []);
          this.uploadPendingDocuments(booking._id, () => {
            this.creating.set(false);
            this.step.set(4);
          });
        },
        error: () => {
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
      error: () => {
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
      error: () => undefined,
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
      error: () => undefined,
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
