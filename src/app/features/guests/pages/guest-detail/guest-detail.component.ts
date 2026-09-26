import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { BOOKING_STATUS_SEVERITY, type BookingRow } from '../../../../core/models/booking.model';
import type { Guest } from '../../../../core/models/guest.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { BookingDetailDrawerService } from '../../../bookings/services/booking-detail-drawer.service';
import { BookingsApiService } from '../../../bookings/services/bookings-api.service';
import { GuestApiService } from '../../services/guest-api.service';

@Component({
  selector: 'app-guest-detail',
  imports: [
    DatePipe,
    FormsModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    Button,
    Textarea,
    Paginator,
    ConfirmDialog,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './guest-detail.component.html',
  styleUrl: './guest-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestDetailComponent {
  private readonly guestApi = inject(GuestApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly drawer = inject(BookingDetailDrawerService);

  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly guestId = this.route.snapshot.paramMap.get('guestId')!;
  readonly guest = signal<Guest | null>(null);
  readonly loading = signal(true);

  readonly newNoteText = signal('');
  readonly addingNote = signal(false);

  readonly bookings = signal<BookingRow[]>([]);
  readonly bookingsLoading = signal(true);
  readonly bookingsTotal = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  constructor() {
    this.reload();
    this.reloadBookings();
  }

  reload(): void {
    this.loading.set(true);
    this.guestApi.getById(this.guestId).subscribe({
      next: (guest) => {
        this.guest.set(guest);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  reloadBookings(): void {
    this.bookingsLoading.set(true);
    this.bookingsApi.guestHistory(this.guestId, this.page(), this.pageSize()).subscribe({
      next: ({ items, pagination }) => {
        this.bookings.set(items);
        this.bookingsTotal.set(pagination.total);
        this.bookingsLoading.set(false);
      },
      error: () => this.bookingsLoading.set(false),
    });
  }

  onPaginatorChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    this.page.set(Math.floor(first / rows) + 1);
    this.pageSize.set(rows);
    this.reloadBookings();
  }

  back(): void {
    void this.router.navigate(['/guests']);
  }

  openBooking(row: BookingRow): void {
    this.drawer.open(row._id);
  }

  addNote(): void {
    const text = this.newNoteText().trim();
    if (!text) return;
    this.addingNote.set(true);
    this.guestApi.addNote(this.guestId, text).subscribe({
      next: (guest) => {
        this.guest.set(guest);
        this.newNoteText.set('');
        this.addingNote.set(false);
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Could not add note' });
        this.addingNote.set(false);
      },
    });
  }

  removeNote(noteId: string): void {
    this.confirmation.confirm({
      message: 'Delete this note? This cannot be undone.',
      header: 'Confirm deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.guestApi.deleteNote(this.guestId, noteId).subscribe({
          next: (guest) => this.guest.set(guest),
          error: (err) =>
            this.messages.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Could not delete note' }),
        });
      },
    });
  }
}
