/** Shapes aligned with managementBackend /bookings routes. */

import type { PrivateRoomRow, PublicHallRow } from './unit-admin.model';

export type BookingAccommodationType = 'room' | 'hall';
export type BookingSource = 'reservation' | 'walk_in';
export type BookingStatus = 'reserved' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface BookingOccupancy {
  adults?: number;
  children?: number;
  totalGuests?: number;
  partySize?: number;
}

export interface BookingUnitTransfer {
  fromUnitId: string;
  toUnitId: string;
  transferredAt: string;
  reason?: string;
}

export interface BookingUnitRow {
  _id: string;
  bookingId: string;
  branchId: string;
  unitId: string;
  unitType: 'private_room' | 'public_hall';
  checkInDate: string;
  expectedCheckOut: string;
  actualCheckIn?: string | null;
  actualCheckOut?: string | null;
  status: BookingStatus;
  occupancy: BookingOccupancy;
  guestIds: string[];
  transferHistory?: BookingUnitTransfer[];
}

export interface BookingRow {
  _id: string;
  bookingNumber: string;
  branchId: string;
  bookingType: BookingAccommodationType;
  source: BookingSource;
  primaryGuestId: string;
  guestIds: string[];
  status: BookingStatus;
  notes?: string;
  documents?: BookingDocument[];
  createdAt?: string;
}

/** One uploaded document attached to a booking (e.g. guest ID/photo captured at confirmation). */
export interface BookingDocument {
  _id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

/** Trimmed guest fields resolved server-side for the booking-detail view — enough to show
 *  who's on the booking without a follow-up request per guest. */
export interface BookingGuestSummary {
  _id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  cnic?: string | null;
}

export interface BookingWithLines {
  booking: BookingRow;
  lines: BookingUnitRow[];
  /** Every guest referenced by `booking.guestIds` (includes the primary guest). */
  guests: BookingGuestSummary[];
  /** The room/hall each line's `unitId` points to, resolved server-side. */
  units: (PrivateRoomRow | PublicHallRow)[];
}

export interface BookingLineRequest {
  unitId: string;
  unitType: 'private_room' | 'public_hall';
  checkInDate: string;
  expectedCheckOut: string;
  occupancy: BookingOccupancy;
  guestIds: string[];
}

export interface BookingCreateRequest {
  branchId: string;
  bookingType: BookingAccommodationType;
  source?: BookingSource;
  primaryGuestId: string;
  guestIds?: string[];
  notes?: string;
  lines: BookingLineRequest[];
  checkInNow?: boolean;
}

export interface HallGroupCheckInRequest {
  branchId: string;
  primaryGuestId: string;
  guestIds: string[];
  partySize: number;
  expectedCheckOut: string;
  notes?: string;
}

export const BOOKING_STATUS_SEVERITY: Record<BookingStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
  reserved: 'info',
  checked_in: 'success',
  checked_out: 'secondary',
  cancelled: 'danger',
  no_show: 'warn',
};

export function bookingStatusLabel(status: BookingStatus): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
