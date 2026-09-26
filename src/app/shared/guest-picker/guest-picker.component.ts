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
import type { BookingRow } from '../../core/models/booking.model';
import { GuestApiService } from '../../features/guests/services/guest-api.service';
import { BookingsApiService } from '../../features/bookings/services/bookings-api.service';
import { FieldErrorComponent } from '../field-error/field-error.component';

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
    () => this.lastQuery().trim().length > 0 && !this.searching() && this.suggestions().length === 0,
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
    dateOfBirth: [null as Date | null],
    notes: [''],
  });

  search(event: AutoCompleteCompleteEvent): void {
    this.lastQuery.set(event.query);
    this.searching.set(true);
    // Guests are searchable by name, email, phone, or CNIC/passport — one box, `q` covers all four server-side.
    this.guestApi.list({ q: event.query, limit: 10 }).subscribe({
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
    typeof guest === 'string' ? guest : `${guest.fullName}${guest.phone ? ' · ' + guest.phone : ''}`;

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
          this.messages.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Could not create guest' });
          return of(null);
        }),
      );
  }
}
