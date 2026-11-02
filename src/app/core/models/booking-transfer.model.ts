/** Shapes aligned with GET /bookings/:bookingId/units/:lineId/transfer-options. */

/** Why a room can't take the stay: it is the current room, booked for these dates, under maintenance, or not ready yet. */
export type TransferBlockReason = 'current' | 'booked' | 'maintenance' | 'notReady';

export interface TransferRoom {
  _id: string;
  code: string;
  status: string;
  capacity: { adults: number; children: number; total: number };
  roomTypeName: string | null;
  floorId: string;
  floorLabel: string | null;
  floorOrder: number;
  buildingId: string | null;
  buildingName: string | null;
  selectable: boolean;
  reason: TransferBlockReason | null;
  /** Fewer beds than guests — shown as a warning only; the front desk decides. */
  tooSmall: boolean;
}

export interface TransferOptions {
  booking: { _id: string; bookingNumber: string; primaryGuestName: string | null };
  line: {
    _id: string;
    status: 'reserved' | 'checked_in';
    checkInDate: string;
    expectedCheckOut: string;
    occupancy: { adults?: number; children?: number; totalGuests?: number };
  };
  guests: number;
  window: { from: string; to: string };
  current: TransferRoom | null;
  rooms: TransferRoom[];
}

/** Quick reasons offered on the transfer screen (the key is also stored, prefixed to any note). */
export const TRANSFER_REASONS = ['guestRequest', 'upgrade', 'maintenance', 'comfort', 'noise', 'other'] as const;
export type TransferReasonKey = (typeof TRANSFER_REASONS)[number];
