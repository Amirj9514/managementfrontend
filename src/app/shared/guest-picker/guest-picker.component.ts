import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, of, tap } from 'rxjs';
import type { Guest } from '../../core/models/guest.model';
import { BOOKING_STATUS_SEVERITY, type BookingRow } from '../../core/models/booking.model';
import { GuestApiService } from '../../features/guests/services/guest-api.service';
import { BookingsApiService } from '../../features/bookings/services/bookings-api.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { FieldErrorComponent } from '../field-error/field-error.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { GUEST_PICKER_DICTIONARY } from './guest-picker.dictionary';
import { CountryStateFieldsComponent } from '../country-state-fields/country-state-fields.component';
import { DEFAULT_COUNTRY } from '../../core/data/countries';

/** Which new-guest field a typed search query most likely belongs to. */
function classifySeed(value: string): 'email' | 'phone' | 'cnic' | 'fullName' {
  const v = value.trim();
  if (v.includes('@')) return 'email';
  const digitsOnly = v.replace(/[\s-]/g, '');
  if (/^\+?\d{6,}$/.test(digitsOnly)) return 'phone';
  if (/^[a-zA-Z0-9-]{5,}$/.test(v) && /\d/.test(v)) return 'cnic';
  return 'fullName';
}

/** The picker only ever glances at the single most recent booking — the total count still
 *  comes from the same paginated response, so no extra request is needed for that. */
const RECENT_BOOKINGS_LIMIT = 1;

/** Search-or-create guest selector used by the booking wizard and hall quick check-in. */
@Component({
  selector: 'app-guest-picker',
  imports: [
    DatePipe,
    AutoComplete,
    FormsModule,
    ReactiveFormsModule,
    Button,
    Drawer,
    Fluid,
    InputText,
    DatePicker,
    Textarea,
    FieldErrorComponent,
    StatusBadgeComponent,
    CountryStateFieldsComponent,
    TranslatePipe,
  ],
  templateUrl: './guest-picker.component.html',
  styleUrl: './guest-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestPickerComponent {
  private readonly guestApi = inject(GuestApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly selected = model<Guest | null>(null);
  readonly guestCreated = output<Guest>();

  readonly today = new Date();
  readonly suggestions = signal<Guest[]>([]);
  readonly searching = signal(false);
  readonly lastQuery = signal('');
  readonly newGuestVisible = signal(false);
  readonly saving = signal(false);

  /** Recent-bookings glance for whichever guest is currently selected — only the most
   *  recent booking is kept, `historyTotal` still reflects the true total count. */
  readonly history = signal<BookingRow[]>([]);
  readonly historyTotal = signal(0);
  readonly historyLoading = signal(false);
  readonly lastBooking = computed(() => this.history()[0] ?? null);

  /** Most recently added note for the selected guest — `notesLog` entries are appended in
   *  order, so the last element is the newest. */
  readonly lastNote = computed(() => {
    const log = this.selected()?.notesLog;
    return log && log.length > 0 ? log[log.length - 1] : null;
  });

  /** Shown only once a search has actually run and come back empty — not before the user has typed anything. */
  readonly noResults = computed(
    () =>
      this.lastQuery().trim().length > 0 &&
      !this.needsIdentityQuery() &&
      !this.searching() &&
      this.suggestions().length === 0,
  );

  /** Whether the parent wizard's own "Next" action has something to commit first — either a
   *  guest is already picked, or the new-guest drawer is open with unsaved input. */
  readonly hasPendingGuestInput = computed(() => this.selected() !== null || this.newGuestVisible());

  readonly newGuestForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: [''],
    phone: [''],
    cnic: [''],
    address: [''],
    country: [DEFAULT_COUNTRY],
    state: [''],
    dateOfBirth: [null as Date | null],
    notes: [''],
  });

  constructor() {
    this.i18n.register(GUEST_PICKER_DICTIONARY);
  }

  /** True while the typed text can't be a phone/CNIC/passport (no digits) — e.g. a name. */
  readonly needsIdentityQuery = computed(() => {
    const q = this.lastQuery().trim();
    return q.length > 0 && !/\d/.test(q);
  });

  search(event: AutoCompleteCompleteEvent): void {
    this.lastQuery.set(event.query);
    // Guests are identified by phone, CNIC or passport only — never by name — so a query with no
    // digits can't match anything; skip the round-trip and let the hint explain why.
    if (!/\d/.test(event.query)) {
      this.suggestions.set([]);
      this.searching.set(false);
      return;
    }
    this.searching.set(true);
    this.guestApi.list({ q: event.query, searchBy: 'identity', limit: 10 }).subscribe({
      next: (results) => {
        this.suggestions.set(results);
        this.searching.set(false);
      },
      error: () => {
        this.suggestions.set([]);
        this.searching.set(false);
      },
    });
  }

  /**
   * PrimeNG's autocomplete keeps the model in sync with whatever is in the input —
   * including free-typed text that never matched a suggestion. Only ever accept a
   * real Guest object here; a bare string means the user is still typing and must
   * NOT be written into `selected` (that was rendering as a guest with every field
   * blank/dashed instead of showing "no guest selected").
   */
  onModelChange(value: unknown): void {
    if (value && typeof value === 'object') {
      this.setSelected(value as Guest);
    } else if (!value) {
      this.selected.set(null);
      this.clearHistory();
    }
  }

  onGuestSelect(event: AutoCompleteSelectEvent): void {
    this.setSelected(event.value as Guest);
  }

  private setSelected(guest: Guest): void {
    this.selected.set(guest);
    this.loadHistory(guest._id);
  }

  private clearHistory(): void {
    this.history.set([]);
    this.historyTotal.set(0);
  }

  private loadHistory(guestId: string): void {
    this.historyLoading.set(true);
    this.bookingsApi.guestHistory(guestId, 1, RECENT_BOOKINGS_LIMIT).subscribe({
      next: ({ items, pagination }) => {
        this.history.set(items);
        this.historyTotal.set(pagination.total);
        this.historyLoading.set(false);
      },
      error: () => {
        this.clearHistory();
        this.historyLoading.set(false);
      },
    });
  }

  viewProfile(): void {
    const guest = this.selected();
    if (guest) void this.router.navigate(['/guests', guest._id]);
  }

  displayGuest = (guest: Guest | string): string =>
    typeof guest === 'string'
      ? guest
      : [guest.fullName, guest.phone, guest.cnic].filter((part): part is string => !!part).join(' · ');

  /** Opens the new-guest drawer, pre-filling whichever field the typed search text looks like. */
  openNewGuest(seed?: string): void {
    const value = (seed ?? '').trim();
    const field = value ? classifySeed(value) : null;
    this.newGuestForm.reset({
      fullName: field === 'fullName' ? value : '',
      email: field === 'email' ? value : '',
      phone: field === 'phone' ? value : '',
      cnic: field === 'cnic' ? value : '',
      address: '',
      country: DEFAULT_COUNTRY,
      state: '',
      dateOfBirth: null,
      notes: '',
    });
    this.newGuestVisible.set(true);
  }

  /** The drawer's own "Create guest" button. */
  submitNewGuest(): void {
    if (this.newGuestForm.invalid) {
      this.newGuestForm.markAllAsTouched();
      return;
    }
    this.createGuest().subscribe();
  }

  /**
   * Called by a parent wizard's own "Next" action: if the new-guest drawer is open, validates
   * and creates that guest before letting the caller proceed; otherwise resolves immediately
   * with whatever guest is already selected (or null).
   */
  commitPendingGuest(): Observable<Guest | null> {
    if (!this.newGuestVisible()) {
      return of(this.selected());
    }
    if (this.newGuestForm.invalid) {
      this.newGuestForm.markAllAsTouched();
      return of(null);
    }
    return this.createGuest();
  }

  private createGuest(): Observable<Guest | null> {
    this.saving.set(true);
    const v = this.newGuestForm.getRawValue();
    return this.guestApi
      .create({
        fullName: v.fullName!,
        email: v.email || undefined,
        phone: v.phone || undefined,
        cnic: v.cnic || undefined,
        address: v.address || undefined,
        country: v.country || undefined,
        state: v.state?.trim() || undefined,
        dateOfBirth: v.dateOfBirth ? v.dateOfBirth.toISOString() : undefined,
        notes: v.notes || undefined,
      })
      .pipe(
        tap((guest) => {
          this.guestCreated.emit(guest);
          this.setSelected(guest);
          this.newGuestVisible.set(false);
          this.saving.set(false);
        }),
        catchError((err) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary: this.i18n.t('common.error'),
            detail: err?.message || this.i18n.t('guestPicker.createGuestFailed'),
          });
          return of(null);
        }),
      );
  }
}
