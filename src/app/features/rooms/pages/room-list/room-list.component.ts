import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators, type ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService, type MenuItem } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';
import { Fluid } from 'primeng/fluid';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Subject, concatMap, debounceTime, distinctUntilChanged, forkJoin, from, map, of, switchMap, toArray, type Observable } from 'rxjs';
import { CanDirective } from '../../../../core/directives/can.directive';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type { BuildingListRow } from '../../../../core/models/building-admin.model';
import type { FloorListRow } from '../../../../core/models/floor-admin.model';
import { ROOM_TYPE_CATEGORY_OPTIONS, type RoomTypeRow } from '../../../../core/models/room-type-admin.model';
import type { AmenityRow, PrivateRoomRow, UnitStatus } from '../../../../core/models/unit-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { AmenitiesApiService } from '../../../amenities/services/amenities-api.service';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { ROOMS_DICTIONARY } from '../../rooms.dictionary';
import { RoomTypesApiService } from '../../services/room-types-api.service';
import { RoomsApiService } from '../../services/rooms-api.service';

type ViewMode = 'grid' | 'table';
const VIEW_KEY = 'rooms.view';
const MAX_BULK = 200;
const STATUSES: UnitStatus[] = ['available', 'occupied', 'cleaning', 'maintenance'];

const norm = (v: string): string => v.trim().replace(/\s+/g, ' ').toLowerCase();

/** "101, 102, 110-115" → ["101","102","110",…,"115"]. Ranges are numeric and keep leading zeros ("001-003"). */
export function parseRoomCodes(text: string): { codes: string[]; tooMany: boolean } {
  const out: string[] = [];
  const seen = new Set<string>();
  let tooMany = false;
  const add = (c: string) => {
    const k = c.toLowerCase();
    if (!c || seen.has(k)) return;
    if (out.length >= MAX_BULK) {
      tooMany = true;
      return;
    }
    seen.add(k);
    out.push(c);
  };
  for (const raw of text.split(/[,\n;]+/)) {
    const token = raw.trim();
    const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(token);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      const width = m[1].startsWith('0') ? m[1].length : 0;
      if (b >= a && b - a < 1000) for (let n = a; n <= b; n++) add(String(n).padStart(width, '0'));
      else if (b >= a) tooMany = true;
      else add(token);
    } else {
      add(token);
    }
  }
  return { codes: out, tooMany };
}

/** Total capacity can't be less than adults + children (the server enforces the same). */
function capacityValidator(g: AbstractControl): ValidationErrors | null {
  const a = Number(g.get('adults')?.value ?? 0);
  const c = Number(g.get('children')?.value ?? 0);
  const t = Number(g.get('total')?.value ?? 0);
  return t < a + c ? { totalTooLow: a + c } : null;
}

/**
 * Rooms: every room of a branch at a glance (grouped by building and floor), with live status counts, search,
 * quick status changes, a guided add/edit drawer (location, details, capacity, amenities, status) that can add
 * many rooms at once, and the room-type manager.
 */
@Component({
  selector: 'app-room-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    Dialog,
    Drawer,
    Fluid,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Menu,
    Select,
    SelectButton,
    Skeleton,
    EmptyStateComponent,
    FieldErrorComponent,
    PageHeaderComponent,
    TranslatePipe,
    CanDirective,
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
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);

  readonly statuses = STATUSES;
  readonly canCreate = computed(() => this.auth.can('rooms.create'));
  readonly canEdit = computed(() => this.auth.can('rooms.edit'));

  // --- data
  readonly branches = signal<BranchListRow[]>([]);
  readonly buildings = signal<BuildingListRow[]>([]);
  readonly floors = signal<FloorListRow[]>([]);
  readonly roomTypes = signal<RoomTypeRow[]>([]);
  readonly amenities = signal<AmenityRow[]>([]);
  readonly rooms = signal<PrivateRoomRow[]>([]);
  readonly loading = signal(true);

  // --- filters
  readonly branchId = signal<string | undefined>(undefined);
  readonly buildingId = signal<string | null>(null);
  readonly floorId = signal<string | null>(null);
  readonly statusFilter = signal<UnitStatus | null>(null);
  readonly search = signal('');
  readonly view = signal<ViewMode>(this.loadView());
  private readonly search$ = new Subject<string>();

  readonly viewOptions = [
    { icon: 'pi pi-th-large', value: 'grid' as ViewMode },
    { icon: 'pi pi-list', value: 'table' as ViewMode },
  ];
  readonly categoryOptionsT = computed(() => {
    this.i18n.currentLang();
    return ROOM_TYPE_CATEGORY_OPTIONS.map((o) => ({ ...o, label: this.i18n.t(`roomCategory.${o.value}`) }));
  });

  // --- lookups
  private readonly buildingById = computed(() => new Map(this.buildings().map((b) => [b._id, b])));
  private readonly floorById = computed(() => new Map(this.floors().map((f) => [f._id, f])));
  private readonly typeById = computed(() => new Map(this.roomTypes().map((t) => [t._id, t])));
  private readonly amenityById = computed(() => new Map(this.amenities().map((a) => [a._id, a])));

  readonly floorOptions = computed(() => {
    const b = this.buildingId();
    return this.floors()
      .filter((f) => !b || f.buildingId === b)
      .sort((x, y) => x.sortOrder - y.sortOrder || x.label.localeCompare(y.label));
  });
  readonly buildingOptions = computed(() => [...this.buildings()].sort((a, b) => a.name.localeCompare(b.name)));

  /** Rooms matching building / floor / search — status chips count within this, then the status filter narrows it. */
  private readonly scoped = computed(() => {
    const b = this.buildingId();
    if (!b) return [] as PrivateRoomRow[]; // rooms are only listed once a building is chosen
    const f = this.floorId();
    const q = norm(this.search());
    return this.rooms().filter((r) => r.buildingId === b && (!f || r.floorId === f) && (!q || norm(r.code).includes(q)));
  });

  /** One tile per building with its size, so you can see where the free rooms are before opening it. */
  readonly buildingCards = computed(() =>
    this.buildingOptions().map((b) => {
      const mine = this.rooms().filter((r) => r.buildingId === b._id);
      return {
        id: b._id,
        name: b.name,
        total: mine.length,
        available: mine.filter((r) => r.status === 'available').length,
        floors: this.floors().filter((f) => f.buildingId === b._id).length,
      };
    }),
  );

  /** Floor chips of the chosen building, each with its room count. */
  readonly floorChips = computed(() => {
    const b = this.buildingId();
    if (!b) return [];
    const inBuilding = this.rooms().filter((r) => r.buildingId === b);
    return this.floorOptions().map((f) => ({
      id: f._id,
      label: f.label,
      total: inBuilding.filter((r) => r.floorId === f._id).length,
      available: inBuilding.filter((r) => r.floorId === f._id && r.status === 'available').length,
    }));
  });
  readonly buildingRoomCount = computed(() => this.rooms().filter((r) => r.buildingId === this.buildingId()).length);
  readonly selectedBuildingName = computed(() => this.buildingName(this.buildingId()));

  readonly counts = computed(() => {
    const c: Record<UnitStatus | 'all', number> = { all: 0, available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
    for (const r of this.scoped()) {
      c.all++;
      c[r.status]++;
    }
    return c;
  });

  readonly filtered = computed(() => {
    const st = this.statusFilter();
    return this.scoped()
      .filter((r) => !st || r.status === st)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  });

  /** Cards grouped under "Building · Floor". */
  readonly groups = computed(() => {
    const map = new Map<string, { key: string; building: string; floor: string; order: number; rooms: PrivateRoomRow[] }>();
    for (const r of this.filtered()) {
      const key = `${r.buildingId ?? ''}|${r.floorId}`;
      const g = map.get(key) ?? {
        key,
        building: this.buildingName(r.buildingId),
        floor: this.floorLabel(r.floorId),
        order: this.floorById().get(r.floorId)?.sortOrder ?? 0,
        rooms: [],
      };
      g.rooms.push(r);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => a.building.localeCompare(b.building) || a.order - b.order || a.floor.localeCompare(b.floor));
  });

  readonly hasFilters = computed(() => !!this.statusFilter() || !!this.search().trim());
  readonly singleFloorShown = computed(() => this.groups().length <= 1);

  // --- add / edit drawer
  readonly formVisible = signal(false);
  readonly editTarget = signal<PrivateRoomRow | null>(null);
  readonly saving = signal(false);
  readonly isEdit = computed(() => this.editTarget() !== null);
  readonly codesText = signal('');
  readonly formBuilding = signal('');
  readonly formAmenities = signal<string[]>([]);
  readonly formStatus = signal<UnitStatus>('available');

  readonly form = this.fb.nonNullable.group(
    {
      buildingId: ['', Validators.required],
      floorId: ['', Validators.required],
      roomTypeId: ['', Validators.required],
      codes: ['', [Validators.required, Validators.maxLength(2000)]],
      adults: [2, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      total: [2, [Validators.required, Validators.min(1)]],
    },
    { validators: [capacityValidator] },
  );
  private prevSum = 2;

  readonly formFloorOptions = computed(() => {
    const b = this.formBuilding();
    return this.floors()
      .filter((f) => f.buildingId === b)
      .sort((x, y) => x.sortOrder - y.sortOrder || x.label.localeCompare(y.label));
  });

  /** What "Room number(s)" will create, and which already exist on the chosen floor. */
  readonly formFloorId = signal('');
  readonly codePlan = computed(() => {
    const { codes, tooMany } = parseRoomCodes(this.codesText());
    const here = new Set(this.rooms().filter((r) => r.floorId === this.formFloorId()).map((r) => r.code.toLowerCase()));
    const target = this.editTarget();
    const fresh = codes.filter((c) => !here.has(c.toLowerCase()));
    return { codes, fresh, existing: codes.length - fresh.length, tooMany, editClash: !!target && codes.length === 1 && codes[0].toLowerCase() !== target.code.toLowerCase() && here.has(codes[0].toLowerCase()) };
  });

  /** Active amenities, plus any inactive one this room already has (so editing never silently drops it). */
  readonly amenityChoices = computed(() => {
    const have = new Set(this.formAmenities());
    return this.amenities().filter((a) => a.active || have.has(a._id));
  });

  // --- view drawer
  readonly viewVisible = signal(false);
  readonly viewTarget = signal<PrivateRoomRow | null>(null);

  // --- room types
  readonly typeMgmtVisible = signal(false);
  readonly savingType = signal(false);
  readonly typeForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['single'],
    maxAdults: [2, [Validators.required, Validators.min(1)]],
    maxChildren: [0, [Validators.min(0)]],
    maxOccupancy: [2, [Validators.required, Validators.min(1)]],
    allowsShared: [false],
  });

  readonly menuItems = signal<MenuItem[]>([]);
  readonly busyId = signal<string | null>(null);
  /** Set by a deep link ("view this room" from a booking): opens that room once it is loaded. */
  readonly pendingUnitId = signal<string | null>(null);
  private pendingBuilding: string | null = null;
  private pendingFloor: string | null = null;

  constructor() {
    this.i18n.register(ROOMS_DICTIONARY);
    this.search$.pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed()).subscribe((v) => this.search.set(v));

    const f = this.form.controls;
    f.codes.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.codesText.set(v ?? ''));
    f.buildingId.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      this.formBuilding.set(v ?? '');
      const floors = this.formFloorOptions();
      // keep the floor only if it belongs to the new building; a single floor is preselected
      if (!floors.some((x) => x._id === f.floorId.value)) f.floorId.setValue(floors.length === 1 ? floors[0]._id : '');
    });
    f.floorId.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.formFloorId.set(v ?? ''));
    // Total follows adults + children until it is set to something larger on purpose.
    const follow = () => {
      const sum = (f.adults.value ?? 0) + (f.children.value ?? 0);
      if (f.total.value === this.prevSum || f.total.value < sum) f.total.setValue(sum);
      this.prevSum = sum;
    };
    f.adults.valueChanges.pipe(takeUntilDestroyed()).subscribe(follow);
    f.children.valueChanges.pipe(takeUntilDestroyed()).subscribe(follow);

    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        const qBranch = this.route.snapshot.queryParamMap.get('branchId');
        const start = items.find((b) => b._id === qBranch) ?? items[0];
        if (start) this.onBranchChange(start._id);
        else this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.amenitiesApi.list(1, 100).subscribe({ next: ({ items }) => this.amenities.set(items) });

    // Deep link from a booking: filters + open the room once loaded.
    const qp = this.route.snapshot.queryParamMap;
    this.pendingUnitId.set(qp.get('unitId'));
    this.pendingBuilding = qp.get('buildingId');
    this.pendingFloor = qp.get('floorId');

    effect(() => {
      const id = this.pendingUnitId();
      if (!id) return;
      const row = this.rooms().find((r) => r._id === id);
      if (row) {
        this.pendingUnitId.set(null);
        this.openView(row);
      }
    });
  }

  private loadView(): ViewMode {
    try {
      return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'grid';
    } catch {
      return 'grid';
    }
  }

  setView(v: ViewMode | null): void {
    if (!v) return;
    this.view.set(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode */
    }
  }

  // --- loading
  onBranchChange(branchId: string | null): void {
    this.branchId.set(branchId ?? undefined);
    this.buildingId.set(null);
    this.floorId.set(null);
    this.statusFilter.set(null);
    this.buildings.set([]);
    this.floors.set([]);
    this.rooms.set([]);
    if (!branchId) {
      this.loading.set(false);
      return;
    }
    this.roomTypesApi.list(branchId).subscribe({ next: ({ items }) => this.roomTypes.set(items) });
    this.reload();
  }

  /** Everything of the branch in one go: buildings → their floors, and all rooms (the API caps a page at 100). */
  reload(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.loading.set(true);
    forkJoin({
      buildings: this.buildingsApi.list(1, 100, 'active', branchId).pipe(map((r) => r.items)),
      rooms: this.fetchAllRooms(branchId),
    })
      .pipe(
        switchMap(({ buildings, rooms }) =>
          (buildings.length ? forkJoin(buildings.map((b) => this.floorsApi.list(b._id, 1, 100, 'active').pipe(map((r) => r.items)))) : of([] as FloorListRow[][])).pipe(
            map((floors) => ({ buildings, rooms, floors: floors.flat() })),
          ),
        ),
      )
      .subscribe({
        next: ({ buildings, rooms, floors }) => {
          this.buildings.set(buildings);
          this.floors.set(floors);
          this.rooms.set(rooms);
          this.loading.set(false);
          this.chooseInitialBuilding();
        },
        error: () => this.loading.set(false),
      });
  }

  /** Deep link first, then the building used last time, then the only building if there is just one. */
  private chooseInitialBuilding(): void {
    const ids = new Set(this.buildings().map((b) => b._id));
    if (this.pendingBuilding && ids.has(this.pendingBuilding)) {
      this.buildingId.set(this.pendingBuilding);
      this.floorId.set(this.pendingFloor);
      this.pendingBuilding = this.pendingFloor = null;
      return;
    }
    this.pendingBuilding = this.pendingFloor = null;
    const current = this.buildingId();
    if (current && ids.has(current)) return; // keep the choice across reloads (after saving a room, etc.)
    let remembered: string | null = null;
    try {
      remembered = localStorage.getItem(this.buildingKey());
    } catch {
      /* private mode */
    }
    const pick = remembered && ids.has(remembered) ? remembered : this.buildings().length === 1 ? this.buildings()[0]._id : null;
    if (pick) this.selectBuilding(pick);
  }

  private buildingKey(): string {
    return `rooms.building.${this.branchId() ?? ''}`;
  }

  private fetchAllRooms(branchId: string): Observable<PrivateRoomRow[]> {
    return this.roomsApi.list({ branchId }, 1, 100).pipe(
      switchMap((first) => {
        const pages = Math.ceil(first.pagination.total / 100);
        if (pages <= 1) return of(first.items);
        return forkJoin(Array.from({ length: pages - 1 }, (_, i) => this.roomsApi.list({ branchId }, i + 2, 100))).pipe(
          map((rest) => [...first.items, ...rest.flatMap((p) => p.items)]),
        );
      }),
    );
  }

  // --- filter handlers
  /** Opens one building and starts on its first floor, so only a manageable slice of rooms is on screen. */
  selectBuilding(id: string | null): void {
    this.buildingId.set(id);
    this.statusFilter.set(null);
    this.search.set('');
    const first = id ? this.floorOptions()[0] : undefined;
    this.floorId.set(first?._id ?? null);
    try {
      if (id) localStorage.setItem(this.buildingKey(), id);
      else localStorage.removeItem(this.buildingKey());
    } catch {
      /* private mode */
    }
  }

  selectFloor(id: string | null): void {
    this.floorId.set(id);
  }

  onSearch(v: string): void {
    this.search$.next(v);
  }

  clearFilters(): void {
    this.statusFilter.set(null);
    this.search.set('');
  }

  // --- presentation helpers
  typeName(id: string): string {
    return this.typeById().get(id)?.name ?? '—';
  }

  buildingName(id: string | null | undefined): string {
    return (id && this.buildingById().get(id)?.name) || '—';
  }

  floorLabel(id: string | null | undefined): string {
    return (id && this.floorById().get(id)?.label) || '—';
  }

  amenitiesOf(r: PrivateRoomRow): AmenityRow[] {
    return (r.amenityIds ?? []).map((id) => this.amenityById().get(id)).filter((a): a is AmenityRow => !!a);
  }

  iconOf(a: AmenityRow): string {
    const i = (a.icon ?? '').trim();
    return i ? (i.startsWith('pi ') ? i : `pi ${i}`) : 'pi pi-tag';
  }

  statusKey(s: UnitStatus): string {
    return `status.${s}`;
  }

  // --- view
  openView(row: PrivateRoomRow): void {
    this.viewTarget.set(row);
    this.viewVisible.set(true);
  }

  editFromView(): void {
    const row = this.viewTarget();
    if (!row) return;
    this.viewVisible.set(false);
    this.openEdit(row);
  }

  // --- add / edit
  private resetForm(v: { buildingId: string; floorId: string; roomTypeId: string; codes: string; adults: number; children: number; total: number }, amenityIds: string[], status: UnitStatus): void {
    this.prevSum = v.adults + v.children;
    this.form.reset(v);
    this.formBuilding.set(v.buildingId);
    this.formFloorId.set(v.floorId);
    this.codesText.set(v.codes);
    this.formAmenities.set(amenityIds);
    this.formStatus.set(status);
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.controls.buildingId.enable();
    this.form.controls.floorId.enable();
    // Start from whatever the list is already narrowed to; a lone building/floor is preselected.
    const buildingId = this.buildingId() ?? (this.buildings().length === 1 ? this.buildings()[0]._id : '');
    const floors = this.floors().filter((f) => f.buildingId === buildingId);
    const floorId = this.floorId() ?? (floors.length === 1 ? floors[0]._id : '');
    const types = this.roomTypes().filter((t) => !t.deletedAt);
    this.resetForm({ buildingId, floorId, roomTypeId: types.length === 1 ? types[0]._id : '', codes: '', adults: 2, children: 0, total: 2 }, [], 'available');
    this.formVisible.set(true);
  }

  openEdit(row: PrivateRoomRow): void {
    this.editTarget.set(row);
    this.form.controls.buildingId.disable();
    this.form.controls.floorId.disable();
    this.resetForm(
      {
        buildingId: row.buildingId ?? '',
        floorId: row.floorId,
        roomTypeId: row.roomTypeId,
        codes: row.code,
        adults: row.capacity.adults,
        children: row.capacity.children,
        total: row.capacity.total,
      },
      row.amenityIds ?? [],
      row.status,
    );
    this.formVisible.set(true);
  }

  toggleAmenity(id: string): void {
    this.formAmenities.update((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  setFormStatus(s: UnitStatus): void {
    this.formStatus.set(s);
  }

  openTypesFromForm(): void {
    this.formVisible.set(false);
    this.openTypeMgmt();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const target = this.editTarget();
    const plan = this.codePlan();
    const base = {
      roomTypeId: v.roomTypeId,
      capacity: { adults: v.adults, children: v.children, total: v.total },
      amenityIds: this.formAmenities(),
      status: this.formStatus(),
    };

    if (target) {
      if (plan.codes.length !== 1 || plan.editClash) return;
      this.saving.set(true);
      this.roomsApi.update(target._id, { ...base, floorId: target.floorId, code: plan.codes[0] }).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: this.i18n.t('common.updated'), detail: plan.codes[0] });
          this.saving.set(false);
          this.formVisible.set(false);
          this.reload();
        },
        error: () => this.saving.set(false),
      });
      return;
    }

    if (plan.fresh.length === 0) return;
    this.saving.set(true);
    let created = 0;
    from(plan.fresh)
      .pipe(
        concatMap((code) => this.roomsApi.create({ ...base, floorId: v.floorId, code })),
        toArray(),
      )
      .pipe(
        // count successes as they happen so a mid-way failure still reports what was saved
        map((r) => r.length),
      )
      .subscribe({
        next: (n) => {
          created = n;
          this.messages.add({
            severity: 'success',
            summary: this.i18n.t(created === 1 ? 'common.created' : 'rooms.createdMany', { n: created }),
            detail: created === 1 ? plan.fresh[0] : plan.fresh.slice(0, 6).join(', ') + (plan.fresh.length > 6 ? '…' : ''),
          });
          this.saving.set(false);
          this.formVisible.set(false);
          this.reload();
        },
        error: () => {
          this.saving.set(false);
          this.reload();
        },
      });
  }

  // --- status + delete
  prepareMenu(event: Event, row: PrivateRoomRow, menu: { toggle: (e: Event) => void }): void {
    const items: MenuItem[] = [{ label: this.i18n.t('rooms.menu.view'), icon: 'pi pi-eye', command: () => this.openView(row) }];
    if (this.auth.can('rooms.delete')) {
      items.push({ separator: true }, { label: this.i18n.t('rooms.menu.deactivate'), icon: 'pi pi-ban', styleClass: 'menu-danger', command: () => this.remove(row) });
    }
    this.menuItems.set(items);
    menu.toggle(event);
  }

  statusMenu(event: Event, row: PrivateRoomRow, menu: { toggle: (e: Event) => void }): void {
    if (!this.canEdit() || row.status === 'occupied') return;
    this.menuItems.set(
      (['available', 'cleaning', 'maintenance'] as UnitStatus[]).map((s) => ({
        label: this.i18n.t(this.statusKey(s)),
        icon: s === row.status ? 'pi pi-check' : 'pi pi-circle',
        disabled: s === row.status,
        command: () => this.quickSetStatus(row, s),
      })),
    );
    menu.toggle(event);
  }

  quickSetStatus(row: PrivateRoomRow, status: UnitStatus): void {
    if (this.busyId()) return;
    this.busyId.set(row._id);
    this.roomsApi.setStatus(row._id, status).subscribe({
      next: () => {
        this.rooms.update((all) => all.map((r) => (r._id === row._id ? { ...r, status } : r)));
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('rooms.statusUpdated'),
          detail: this.i18n.t('rooms.statusUpdatedDetail', { code: row.code, status: this.i18n.t(this.statusKey(status)) }),
        });
        this.busyId.set(null);
      },
      error: () => this.busyId.set(null),
    });
  }

  remove(row: PrivateRoomRow): void {
    this.confirmation.confirm({
      message: this.i18n.t('rooms.confirmDeactivate', { code: row.code }),
      header: this.i18n.t('rooms.confirmDeactivateHeader'),
      icon: 'pi pi-trash',
      variant: 'danger',
      accept: () => {
        this.roomsApi.delete(row._id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('common.deactivated'), detail: row.code });
            this.reload();
          },
        });
      },
    });
  }

  // --- room types
  openTypeMgmt(): void {
    this.typeForm.reset({ name: '', category: 'single', maxAdults: 2, maxChildren: 0, maxOccupancy: 2, allowsShared: false });
    this.typeMgmtVisible.set(true);
  }

  submitType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const v = this.typeForm.getRawValue();
    this.savingType.set(true);
    this.roomTypesApi
      .create({
        branchId: this.branchId(),
        name: v.name,
        category: v.category as RoomTypeRow['category'],
        maxAdults: v.maxAdults,
        maxChildren: v.maxChildren ?? 0,
        maxOccupancy: v.maxOccupancy,
        allowsShared: v.allowsShared ?? false,
      })
      .subscribe({
        next: (created) => {
          this.messages.add({ severity: 'success', summary: this.i18n.t('rooms.roomTypeCreated'), detail: created.name });
          this.roomTypes.update((rows) => [...rows, created]);
          this.typeForm.reset({ name: '', category: 'single', maxAdults: 2, maxChildren: 0, maxOccupancy: 2, allowsShared: false });
          this.savingType.set(false);
        },
        error: () => this.savingType.set(false),
      });
  }

  toggleTypeEnabled(type: RoomTypeRow): void {
    const isActive = !type.deletedAt;
    const req = isActive ? this.roomTypesApi.delete(type._id) : this.roomTypesApi.restore(type._id);
    req.subscribe({
      next: () => {
        this.roomTypes.update((rows) => rows.map((r) => (r._id === type._id ? { ...r, deletedAt: isActive ? new Date().toISOString() : null } : r)));
      },
    });
  }

  /** Room types that can be picked for a room (disabled ones stay in the manager only). */
  readonly activeTypes = computed(() => this.roomTypes().filter((t) => !t.deletedAt));
}
