import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { BOOKINGS_DICTIONARY } from '../../features/bookings/bookings.dictionary';

/**
 * 'available' — bookable by anyone.
 * 'capacity-warning' — free, but short on beds / space for the party: flagged, still selectable.
 * 'blocked' — a real conflict (booked, maintenance, not ready, current room): never selectable.
 */
export type PickerLevel = 'available' | 'capacity-warning' | 'blocked';

export interface PickerUnit {
  id: string;
  code: string;
  detail: string;
  level: PickerLevel;
  /** Why it is blocked, or the capacity warning. */
  message?: string;
  status: string;
  statusLabel: string;
  statusSeverity: 'success' | 'info' | 'warn' | 'danger';
  typeLabel: string;
  typeId: string | null;
  locationLabel: string;
  capacityText: string;
  amenityNames: string[];
  amenityIds: string[];
  buildingId: string | null;
  floorId: string;
  /** Small label on the card, e.g. "Current room". */
  tag?: string;
}

export interface PickerBuilding {
  id: string;
  name: string;
}

export interface PickerFloor {
  id: string;
  buildingId: string;
  label: string;
  order: number;
}

export interface PickerOption {
  id: string;
  name: string;
}

function isBookable(u: PickerUnit): boolean {
  return u.level !== 'blocked';
}

/**
 * The room / hall picker used by check-in and by room transfer, so both look and behave the same:
 * choose a building (tiles show how many are free), then a floor (chips with free/total counts), then
 * refine (search, type, amenities, "available only", "fits my party"). The chosen unit stays pinned
 * in a bar even when a filter hides it. Presentational: the parent supplies the units and owns the rules.
 */
@Component({
  selector: 'app-unit-picker',
  imports: [FormsModule, Button, Checkbox, InputText, MultiSelect, Select, TranslatePipe],
  templateUrl: './unit-picker.component.html',
  styleUrl: './unit-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitPickerComponent {
  readonly i18n = inject(TranslationService);

  readonly units = input.required<PickerUnit[]>();
  readonly buildings = input<PickerBuilding[]>([]);
  readonly floors = input<PickerFloor[]>([]);
  readonly types = input<PickerOption[]>([]);
  readonly amenities = input<PickerOption[]>([]);
  readonly loading = input(false);
  /** Shown in "Fits my party (N)". */
  readonly partySize = input(1);
  readonly unitWord = input<'rooms' | 'halls'>('rooms');

  /** Two-way: the chosen unit's id. */
  readonly selectedId = model<string | undefined>(undefined);
  /** Fired when the user picks a unit — lets the parent react (e.g. warn about a small room). */
  readonly picked = output<PickerUnit>();

  readonly filterBuildingId = signal<string | undefined>(undefined);
  /** undefined = every floor of the building. */
  readonly filterFloorId = signal<string | undefined>(undefined);
  readonly filterAvailableOnly = signal(true);
  readonly filterFitsParty = signal(false);
  readonly filterTypeId = signal<string | undefined>(undefined);
  readonly filterAmenityIds = signal<string[]>([]);
  readonly filterSearch = signal('');
  /** Once the user picks a floor themselves we stop auto-picking one for them. */
  private floorTouched = false;

  readonly unitWordLabel = computed(() =>
    this.i18n.t(this.unitWord() === 'rooms' ? 'bookings.unitsWord.rooms' : 'bookings.unitsWord.halls'),
  );

  /** A single building is chosen for you; with several, the user must pick one first. */
  readonly effectiveBuildingId = computed(
    () => this.filterBuildingId() ?? (this.buildings().length === 1 ? this.buildings()[0].id : undefined),
  );
  readonly needsBuilding = computed(() => this.buildings().length > 1 && !this.filterBuildingId());

  readonly hasActiveFilters = computed(
    () =>
      !!this.filterSearch().trim() ||
      !!this.filterTypeId() ||
      this.filterAmenityIds().length > 0 ||
      this.filterFitsParty() ||
      !this.filterAvailableOnly(),
  );

  /** The chosen building's units after type / amenity / search / "fits my party" — but not floor, and
   * not "available only", so the floor chips and counts stay meaningful whatever floor is open. */
  readonly scopedBase = computed(() => {
    const building = this.effectiveBuildingId();
    const q = this.filterSearch().trim().toLowerCase();
    const type = this.filterTypeId();
    const amenities = this.filterAmenityIds();
    const fits = this.filterFitsParty();
    return this.units().filter(
      (u) =>
        (!building || u.buildingId === building) &&
        (!fits || u.level === 'available') &&
        (!type || u.typeId === type) &&
        amenities.every((id) => u.amenityIds.includes(id)) &&
        (!q || u.code.toLowerCase().includes(q)),
    );
  });

  private readonly orderedFloors = computed(() =>
    [...this.floors()]
      .filter((f) => !this.effectiveBuildingId() || f.buildingId === this.effectiveBuildingId())
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, undefined, { numeric: true })),
  );

  /** One chip per floor that has anything to show, with "free / total" for the current filters. */
  readonly floorChips = computed(() => {
    if (!this.effectiveBuildingId() && this.buildings().length > 0) return [];
    const base = this.scopedBase();
    return this.orderedFloors()
      .map((f) => {
        const inFloor = base.filter((u) => u.floorId === f.id);
        return { id: f.id, label: f.label, free: inFloor.filter(isBookable).length, total: inFloor.length };
      })
      .filter((c) => c.total > 0);
  });
  readonly allFloorsChip = computed(() => {
    const chips = this.floorChips();
    return { free: chips.reduce((n, c) => n + c.free, 0), total: chips.reduce((n, c) => n + c.total, 0) };
  });

  /** Building tiles: how many of its units could take this stay. */
  readonly buildingCards = computed(() =>
    this.buildings().map((b) => {
      const inBuilding = this.units().filter((u) => u.buildingId === b.id);
      return { id: b.id, name: b.name, free: inBuilding.filter(isBookable).length, total: inBuilding.length };
    }),
  );

  private readonly shownBase = computed(() => {
    const floor = this.filterFloorId();
    return floor ? this.scopedBase().filter((u) => u.floorId === floor) : this.scopedBase();
  });
  readonly shownFree = computed(() => this.shownBase().filter(isBookable).length);
  readonly shownTotal = computed(() => this.shownBase().length);

  /** The units actually listed: nothing until a building is chosen; bookable first. */
  readonly listed = computed<PickerUnit[]>(() => {
    if (this.needsBuilding()) return [];
    let list = this.shownBase();
    if (this.filterAvailableOnly()) list = list.filter(isBookable);
    const rank = (u: PickerUnit) => (u.level === 'available' ? 0 : u.level === 'capacity-warning' ? 1 : 2);
    return [...list].sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code, undefined, { numeric: true }));
  });

  /** Listed units grouped under their floor (a single group when one floor is open). */
  readonly groups = computed(() => {
    const order = new Map(this.orderedFloors().map((f, i) => [f.id, i] as const));
    const labels = new Map(this.floors().map((f) => [f.id, f.label] as const));
    const groups = new Map<string, PickerUnit[]>();
    for (const u of this.listed()) groups.set(u.floorId, [...(groups.get(u.floorId) ?? []), u]);
    return [...groups.entries()]
      .sort(([a], [b]) => (order.get(a) ?? 999) - (order.get(b) ?? 999))
      .map(([floorId, units]) => ({ floorId, label: labels.get(floorId) ?? '', units }));
  });

  readonly selectedUnit = computed(() => this.units().find((u) => u.id === this.selectedId()) ?? null);
  readonly selectedHidden = computed(() => {
    const s = this.selectedUnit();
    return !!s && !this.listed().some((u) => u.id === s.id);
  });

  constructor() {
    this.i18n.register(BOOKINGS_DICTIONARY);

    // Open the first floor with space once there is something to show, so the user sees one floor —
    // not the whole building. Stops as soon as they pick a floor themselves.
    effect(() => {
      if (this.loading() || this.floorTouched || this.filterFloorId() || !this.effectiveBuildingId()) return;
      const first = this.floorChips().find((c) => c.free > 0);
      if (first) untracked(() => this.filterFloorId.set(first.id));
    });
  }

  isSelectable(u: PickerUnit): boolean {
    return isBookable(u);
  }

  selectBuilding(id: string | undefined): void {
    this.filterBuildingId.set(id);
    this.filterFloorId.set(undefined);
    this.floorTouched = false;
  }

  selectFloor(id: string | undefined): void {
    this.floorTouched = true;
    this.filterFloorId.set(id);
  }

  pick(unit: PickerUnit): void {
    if (!isBookable(unit)) return;
    this.selectedId.set(unit.id);
    this.picked.emit(unit);
  }

  clearSelection(): void {
    this.selectedId.set(undefined);
  }

  /** Resets the refinements (not the building / floor, which have their own pickers). */
  clearFilters(): void {
    this.filterSearch.set('');
    this.filterTypeId.set(undefined);
    this.filterAmenityIds.set([]);
    this.filterFitsParty.set(false);
    this.filterAvailableOnly.set(true);
  }
}
