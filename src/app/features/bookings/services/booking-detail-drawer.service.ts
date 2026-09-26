import { Injectable, signal } from '@angular/core';

/**
 * Drives the app-wide booking-detail drawer (mounted once in the shell) so any screen can
 * open a booking's details as a slide-over instead of navigating away to `/bookings/:id`.
 */
@Injectable({ providedIn: 'root' })
export class BookingDetailDrawerService {
  readonly bookingId = signal<string | null>(null);

  open(id: string): void {
    this.bookingId.set(id);
  }

  close(): void {
    this.bookingId.set(null);
  }
}
