import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import {
  TRANSFER_REASONS,
  type TransferOptions,
  type TransferReasonKey,
  type TransferRoom,
} from '../../../../core/models/booking-transfer.model';
import { type UnitStatus, unitStatusSeverity } from '../../../../core/models/unit-admin.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import {
  UnitPickerComponent,
  type PickerBuilding,
  type PickerFloor,
  type PickerOption,
  type PickerUnit,
} from '../../../../shared/unit-picker/unit-picker.component';
import { BOOKINGS_DICTIONARY } from '../../bookings.dictionary';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';

/**
 * Full-page "transfer room" screen. Rooms are picked with the same shared picker the check-in step uses
 * (building › floor › refine). Rooms that cannot take the stay (booked, maintenance, not ready, current)
 * are shown but disabled with the reason — the server applies the same rules, so what looks selectable works.
 */
@Component({
  selector: 'app-booking-transfer',
  imports: [
    DatePipe,
    FormsModule,
    Button,
    Skeleton,
    Tag,
    Textarea,
    PageHeaderComponent,
    UnitPickerComponent,
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
  readonly reasonKey = signal<TransferReasonKey | null>(null);
  readonly note = signal('');

  readonly reasons = TRANSFER_REASONS;

  /** Rooms with safe defaults, so a server that predates the amenity / room-type fields still works. */
  readonly rooms = computed(() =>
    (this.data()?.rooms ?? []).map((r) => ({
      ...r,
      roomTypeId: r.roomTypeId ?? '',
      amenityIds: r.amenityIds ?? [],
      amenityNames: r.amenityNames ?? [],
    })),
  );
  readonly isCheckedIn = computed(() => this.data()?.line.status === 'checked_in');
  readonly selected = computed(() => this.rooms().find((r) => r._id === this.selectedId()) ?? null);
  /** What the shared picker needs, mapped from the server's per-room verdicts. */
  readonly units = computed<PickerUnit[]>(() => {
    const guests = this.data()?.guests ?? 0;
    return this.rooms().map((r) => {
      const level = r.reason ? 'blocked' : r.tooSmall ? 'capacity-warning' : 'available';
      return {
        id: r._id,
        code: r.code,
        detail: this.i18n.t('bookings.capacityCount', { count: r.capacity.total }),
        level,
        message: r.reason
          ? this.i18n.t('transfer.blockedHint.' + r.reason)
          : r.tooSmall
            ? this.i18n.t('bookings.fitsUpTo', { total: r.capacity.total, needed: guests })
            : undefined,
        status: r.status,
        statusLabel: this.i18n.t('status.' + r.status),
        statusSeverity: unitStatusSeverity(r.status as UnitStatus),
        typeLabel: r.roomTypeName ?? this.i18n.t('common.room'),
        typeId: r.roomTypeId,
        locationLabel: [r.buildingName, r.floorLabel].filter(Boolean).join(' · '),
        capacityText:
          `${r.capacity.adults} ${this.i18n.t('common.adults')}` +
          (r.capacity.children ? `, ${r.capacity.children} ${this.i18n.t('common.children')}` : ''),
        amenityNames: r.amenityNames,
        amenityIds: r.amenityIds,
        buildingId: r.buildingId,
        floorId: r.floorId,
        tag: r.reason === 'current' ? this.i18n.t('transfer.blocked.current') : undefined,
      } satisfies PickerUnit;
    });
  });
  readonly pickerBuildings = computed<PickerBuilding[]>(() => {
    const seen = new Map<string, string>();
    for (const r of this.rooms()) if (r.buildingId && r.buildingName) seen.set(r.buildingId, r.buildingName);
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });
  readonly pickerFloors = computed<PickerFloor[]>(() => {
    const seen = new Map<string, PickerFloor>();
    for (const r of this.rooms()) {
      if (r.buildingId && !seen.has(r.floorId)) {
        seen.set(r.floorId, { id: r.floorId, buildingId: r.buildingId, label: r.floorLabel ?? '', order: r.floorOrder });
      }
    }
    return [...seen.values()];
  });
  readonly pickerTypes = computed<PickerOption[]>(() => {
    const seen = new Map<string, string>();
    for (const r of this.rooms()) if (r.roomTypeName) seen.set(r.roomTypeId, r.roomTypeName);
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });
  readonly pickerAmenities = computed<PickerOption[]>(() => {
    const seen = new Map<string, string>();
    for (const r of this.rooms()) r.amenityIds.forEach((id, i) => seen.set(id, r.amenityNames[i] ?? id));
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });

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

  onPick(id: string | undefined): void {
    this.selectedId.set(id ?? null);
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
