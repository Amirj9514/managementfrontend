/** Shapes aligned with GET /bookings/:bookingId/units/:lineId/extend-options and /extend-check. */

/** Another reserved / in-house stay on the same room, coming up behind this one. */
export interface ExtendUpcoming {
  bookingNumber: string | null;
  guestName: string | null;
  checkInDate: string;
  expectedCheckOut: string;
}

export interface ExtendOptions {
  booking: { _id: string; bookingNumber: string; primaryGuestName: string | null };
  line: {
    _id: string;
    status: 'reserved' | 'checked_in';
    unitType: 'private_room' | 'public_hall';
    checkInDate: string;
    expectedCheckOut: string;
    occupancy: { adults?: number; children?: number; totalGuests?: number; partySize?: number };
  };
  unit: {
    _id: string;
    code: string;
    buildingName: string | null;
    floorLabel: string | null;
    roomTypeName: string | null;
    capacity: { adults: number; children: number; total: number } | null;
    maxCapacity: number | null;
    audience: string | null;
  };
  /** Rooms: the next booking's arrival — the latest check-out possible. null = no limit (or a hall). */
  maxCheckOut: string | null;
  upcoming: ExtendUpcoming[];
}

/** Result of asking "could this stay run until X?" — the same rules the real extension applies. */
export interface ExtendCheck {
  available: boolean;
  addedNights?: number;
  reason: string | null;
  message: string | null;
  conflict: ExtendUpcoming | null;
}

/** One-tap extensions offered on the screen (extra nights). */
export const EXTEND_QUICK_NIGHTS = [1, 2, 3, 7] as const;
