import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import {
  EXTEND_QUICK_NIGHTS,
  type ExtendCheck,
  type ExtendOptions,
} from '../../../../core/models/booking-extend.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BOOKINGS_DICTIONARY } from '../../bookings.dictionary';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Full-page "extend stay" screen. Shows the current stay, lets you choose a new check-out (one-tap
 * extra nights, or any date/time up to the next booking), checks availability live, and saves.
 */
@Component({
  selector: 'app-booking-extend',
  imports: [DatePipe, FormsModule, Button, DatePicker, Skeleton, Tag, PageHeaderComponent, TranslatePipe],
  templateUrl: './booking-extend.component.html',
  styleUrl: './booking-extend.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingExtendComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(BookingsApiService);
  private readonly drawer = inject(BookingDetailDrawerService);
  private readonly confirm = inject(ConfirmService);
  private readonly messages = inject(MessageService);
  readonly i18n = inject(TranslationService);

  readonly bookingId = this.route.snapshot.paramMap.get('id')!;
  readonly lineId = this.route.snapshot.paramMap.get('lineId')!;

  readonly data = signal<ExtendOptions | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  /** The chosen day and time of day; combined into the proposed new check-out. */
  readonly pickedDay = signal<Date | null>(null);
  readonly pickedTime = signal<Date | null>(null);
  readonly check = signal<ExtendCheck | null>(null);
  readonly checking = signal(false);

  readonly quickNights = EXTEND_QUICK_NIGHTS;

  readonly current = computed(() => (this.data() ? new Date(this.data()!.line.expectedCheckOut) : null));
  readonly checkIn = computed(() => (this.data() ? new Date(this.data()!.line.checkInDate) : null));
  readonly isRoom = computed(() => this.data()?.line.unitType === 'private_room');
  readonly isCheckedIn = computed(() => this.data()?.line.status === 'checked_in');
  readonly maxCheckOut = computed(() => (this.data()?.maxCheckOut ? new Date(this.data()!.maxCheckOut!) : null));

  /** The proposed check-out (picked day + picked time of day), or null until a day is chosen. */
  readonly newCheckOut = computed<Date | null>(() => {
    const day = this.pickedDay();
    const time = this.pickedTime() ?? this.current();
    if (!day || !time) return null;
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes(), 0, 0);
  });

  /** The calendar can't go before today's check-out day, nor past the next booking's arrival. */
  readonly minDate = computed(() => {
    const c = this.current();
    return c ? new Date(c.getFullYear(), c.getMonth(), c.getDate()) : null;
  });
  readonly maxDate = computed(() => {
    const m = this.maxCheckOut();
    return m ? new Date(m.getFullYear(), m.getMonth(), m.getDate()) : null;
  });

  readonly currentNights = computed(() => this.nightsBetween(this.checkIn(), this.current()));
  readonly newNights = computed(() => this.nightsBetween(this.checkIn(), this.newCheckOut()));
  readonly addedLabel = computed(() => {
    const cur = this.current();
    const next = this.newCheckOut();
    if (!cur || !next || next <= cur) return '';
    const ms = next.getTime() - cur.getTime();
    return ms < DAY_MS
      ? this.i18n.t('extend.addedHours', { count: Math.max(1, Math.round(ms / 3_600_000)) })
      : this.i18n.t('extend.addedNights', { count: Math.round(ms / DAY_MS) });
  });

  readonly canSave = computed(() => !!this.newCheckOut() && this.check()?.available === true && !this.checking() && !this.saving());
  readonly guests = computed(() => {
    const o = this.data()?.line.occupancy;
    return o?.partySize ?? o?.totalGuests ?? (o?.adults ?? 0) + (o?.children ?? 0);
  });

  constructor() {
    this.i18n.register(BOOKINGS_DICTIONARY);

    this.api.extendOptions(this.bookingId, this.lineId).subscribe({
      next: (d) => {
        this.data.set(d);
        this.pickedTime.set(new Date(d.line.expectedCheckOut));
        this.loading.set(false);
      },
      // The global error toast explains why (e.g. the stay is already over); return to the booking.
      error: () => this.back(),
    });

    // Re-check availability whenever the proposed check-out changes (debounced, latest wins).
    toObservable(this.newCheckOut)
      .pipe(
        tap((d) => {
          this.check.set(null);
          this.checking.set(!!d);
        }),
        debounceTime(250),
        switchMap((d) =>
          d
            ? this.api.extendCheck(this.bookingId, this.lineId, d.toISOString()).pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.check.set(result);
        this.checking.set(false);
      });
  }

  private nightsBetween(from: Date | null, to: Date | null): number {
    if (!from || !to) return 0;
    return Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS));
  }

  // ---- choosing the new check-out

  quickDate(nights: number): Date | null {
    const c = this.current();
    return c ? new Date(c.getTime() + nights * DAY_MS) : null;
  }

  quickDisabled(nights: number): boolean {
    const d = this.quickDate(nights);
    const max = this.maxCheckOut();
    return !d || (!!max && d > max);
  }

  isQuickSelected(nights: number): boolean {
    const d = this.quickDate(nights);
    const n = this.newCheckOut();
    return !!d && !!n && Math.abs(d.getTime() - n.getTime()) < 60_000;
  }

  pickQuick(nights: number): void {
    const d = this.quickDate(nights);
    if (!d || this.quickDisabled(nights)) return;
    this.pickedDay.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    this.pickedTime.set(d);
  }

  onDay(date: Date | null): void {
    this.pickedDay.set(date);
  }

  onTime(date: Date | null): void {
    this.pickedTime.set(date);
  }

  clearChoice(): void {
    this.pickedDay.set(null);
    this.pickedTime.set(this.current());
  }

  // ---- leave / save

  back(): void {
    void this.router.navigate(['/bookings']).then(() => this.drawer.open(this.bookingId));
  }

  askConfirm(): void {
    const data = this.data();
    const next = this.newCheckOut();
    if (!data || !next || !this.canSave()) return;
    this.confirm.confirm({
      header: this.i18n.t('extend.confirmHeader'),
      message: this.i18n.t('extend.confirmMessage', {
        guest: data.booking.primaryGuestName ?? this.i18n.t('bookings.unknownGuest'),
        unit: data.unit.code,
        date: new Intl.DateTimeFormat(this.i18n.currentLang() === 'ur' ? 'ur' : 'en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(next),
      }),
      icon: 'pi pi-calendar-plus',
      variant: 'info',
      accept: () => this.save(next),
    });
  }

  private save(next: Date): void {
    this.saving.set(true);
    this.api.extend(this.bookingId, this.lineId, next.toISOString()).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('bookings.toast.extended'),
          detail: this.i18n.t('extend.doneDetail', { unit: this.data()?.unit.code ?? '', nights: this.newNights() }),
        });
        this.saving.set(false);
        this.back();
      },
      error: () => {
        // Something changed since the page loaded (e.g. the room was just booked) — re-run the check.
        this.saving.set(false);
        this.api.extendOptions(this.bookingId, this.lineId).subscribe({ next: (d) => this.data.set(d) });
        const d = this.newCheckOut();
        if (d) {
          this.checking.set(true);
          this.api.extendCheck(this.bookingId, this.lineId, d.toISOString()).subscribe({
            next: (r) => this.check.set(r),
            complete: () => this.checking.set(false),
          });
        }
      },
    });
  }
}
