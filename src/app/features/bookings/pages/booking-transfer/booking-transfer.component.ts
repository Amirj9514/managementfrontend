import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import {
  TRANSFER_REASONS,
  type TransferOptions,
  type TransferReasonKey,
  type TransferRoom,
} from '../../../../core/models/booking-transfer.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BOOKINGS_DICTIONARY } from '../../bookings.dictionary';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';

interface RoomGroup {
  key: string;
  building: string;
  floor: string;
  rooms: TransferRoom[];
  free: number;
}

/** Natural order so R2 comes before R10. */
const byCode = (a: TransferRoom, b: TransferRoom) => a.code.localeCompare(b.code, undefined, { numeric: true });

/**
 * Full-page "transfer room" screen: pick the new room from tiles grouped by building and floor.
 * Rooms that cannot take the stay (booked, maintenance, not ready, current) are shown but disabled
 * with the reason — the server applies the same rules, so what looks selectable here will work.
 */
@Component({
  selector: 'app-booking-transfer',
  imports: [
    DatePipe,
    FormsModule,
    Button,
    IconField,
    InputIcon,
    InputText,
    Select,
    Skeleton,
    Tag,
    Textarea,
    ToggleSwitch,
    Tooltip,
    PageHeaderComponent,
    EmptyStateComponent,
    TranslatePipe,
  ],
  templateUrl: './booking-transfer.component.html',
  styleUrl: './booking-transfer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingTransferComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(BookingsApiService);
  private readonly drawer = inject(BookingDetailDrawerService);
  private readonly confirm = inject(ConfirmService);
  private readonly messages = inject(MessageService);
  readonly i18n = inject(TranslationService);

  readonly bookingId = this.route.snapshot.paramMap.get('id')!;
  readonly lineId = this.route.snapshot.paramMap.get('lineId')!;

  readonly data = signal<TransferOptions | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly selectedId = signal<string | null>(null);
  readonly search = signal('');
  readonly buildingFilter = signal<string | null>(null);
  readonly typeFilter = signal<string | null>(null);
  readonly onlyAvailable = signal(false);
  readonly reasonKey = signal<TransferReasonKey | null>(null);
  readonly note = signal('');

  readonly reasons = TRANSFER_REASONS;
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly rooms = computed(() => this.data()?.rooms ?? []);
  readonly isCheckedIn = computed(() => this.data()?.line.status === 'checked_in');
  readonly selected = computed(() => this.rooms().find((r) => r._id === this.selectedId()) ?? null);
  readonly availableCount = computed(() => this.rooms().filter((r) => r.selectable).length);

  readonly buildingOptions = computed(() => {
    const names = new Map<string, string>();
    for (const r of this.rooms()) if (r.buildingId && r.buildingName) names.set(r.buildingId, r.buildingName);
    return [...names].map(([value, label]) => ({ value, label }));
  });
  readonly typeOptions = computed(() => {
    const names = new Set<string>();
    for (const r of this.rooms()) if (r.roomTypeName) names.add(r.roomTypeName);
    return [...names].sort().map((n) => ({ value: n, label: n }));
  });

  readonly visibleRooms = computed(() => {
    const q = this.search().trim().toLowerCase();
    const building = this.buildingFilter();
    const type = this.typeFilter();
    const onlyFree = this.onlyAvailable();
    return this.rooms().filter(
      (r) =>
        (!q || r.code.toLowerCase().includes(q)) &&
        (!building || r.buildingId === building) &&
        (!type || r.roomTypeName === type) &&
        (!onlyFree || r.selectable),
    );
  });

  /** Rooms grouped Building › Floor, in building / floor order, rooms in natural code order. */
  readonly groups = computed<RoomGroup[]>(() => {
    const map = new Map<string, RoomGroup & { order: number }>();
    for (const r of this.visibleRooms()) {
      const key = `${r.buildingId ?? ''}|${r.floorId}`;
      let g = map.get(key);
      if (!g) {
        g = { key, building: r.buildingName ?? '', floor: r.floorLabel ?? '', rooms: [], free: 0, order: r.floorOrder };
        map.set(key, g);
      }
      g.rooms.push(r);
      if (r.selectable) g.free += 1;
    }
    return [...map.values()]
      .sort((a, b) => a.building.localeCompare(b.building) || a.order - b.order || a.floor.localeCompare(b.floor, undefined, { numeric: true }))
      .map((g) => ({ ...g, rooms: [...g.rooms].sort(byCode) }));
  });

  readonly hasFilters = computed(() => !!(this.search().trim() || this.buildingFilter() || this.typeFilter() || this.onlyAvailable()));

  /** The reason saved with the transfer: the chosen label, plus the note when there is one. */
  readonly reasonText = computed(() => {
    const key = this.reasonKey();
    const label = key ? this.i18n.t('transfer.reason.' + key) : '';
    const note = this.note().trim();
    return [label, note].filter(Boolean).join(': ') || undefined;
  });

  constructor() {
    this.i18n.register(BOOKINGS_DICTIONARY);
    this.api.transferOptions(this.bookingId, this.lineId).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      // The global error toast already explains why (e.g. nothing left to transfer); go back to the booking.
      error: () => this.back(),
    });
  }

  select(room: TransferRoom): void {
    if (!room.selectable) return;
    this.selectedId.update((id) => (id === room._id ? null : room._id));
  }

  clearFilters(): void {
    this.search.set('');
    this.buildingFilter.set(null);
    this.typeFilter.set(null);
    this.onlyAvailable.set(false);
  }

  blockedLabel(room: TransferRoom): string {
    return room.reason ? this.i18n.t('transfer.blocked.' + room.reason) : '';
  }

  tooltipFor(room: TransferRoom): string {
    if (room.reason) return this.i18n.t('transfer.blockedHint.' + room.reason);
    if (room.tooSmall) return this.i18n.t('transfer.tooSmallHint', { beds: room.capacity.total, guests: this.data()?.guests ?? 0 });
    return '';
  }

  back(): void {
    void this.router.navigate(['/bookings']).then(() => this.drawer.open(this.bookingId));
  }

  askConfirm(): void {
    const to = this.selected();
    const data = this.data();
    if (!to || !data || this.saving()) return;
    this.confirm.confirm({
      header: this.i18n.t('transfer.confirmHeader'),
      message: this.i18n.t('transfer.confirmMessage', {
        guest: data.booking.primaryGuestName ?? this.i18n.t('bookings.unknownGuest'),
        from: data.current?.code ?? '—',
        to: to.code,
      }),
      icon: 'pi pi-arrow-right-arrow-left',
      variant: 'warning',
      accept: () => this.submit(to),
    });
  }

  private submit(to: TransferRoom): void {
    this.saving.set(true);
    this.api.transfer(this.bookingId, this.lineId, to._id, this.reasonText()).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('bookings.toast.transferred'),
          detail: this.i18n.t('transfer.doneDetail', { from: this.data()?.current?.code ?? '—', to: to.code }),
        });
        this.saving.set(false);
        this.back();
      },
      error: () => {
        // Something changed since the list loaded (e.g. the room was just booked) — refresh the tiles.
        this.saving.set(false);
        this.selectedId.set(null);
        this.api.transferOptions(this.bookingId, this.lineId).subscribe({ next: (d) => this.data.set(d) });
      },
    });
  }
}
