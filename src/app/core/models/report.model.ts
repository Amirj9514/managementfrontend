import type { BookingUnitRow } from './booking.model';

/** Shapes aligned with managementBackend /reports/* routes. */

export interface OccupancyDayRow {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyPct: number;
}

/** Someone's booking of a hall on a given day. */
export interface HallPartyRow {
  bookingId: string;
  bookingNumber: string | null;
  guestName: string | null;
  partySize: number;
  status: string;
  checkInDate: string;
  expectedCheckOut: string;
}

/** A day on which the hall had at least one party — empty days are never returned. */
export interface HallOccupancyDayRow {
  date: string;
  occupied: number;
  remaining: number;
  utilizationPct: number;
  parties: HallPartyRow[];
}

/** A hall that was used in the period (halls with no parties are not returned). */
export interface HallOccupancyReportRow {
  hallId: string;
  code: string;
  audience: string;
  maxCapacity: number;
  daysWithStays: number;
  peakOccupied: number;
  perDay: HallOccupancyDayRow[];
}

export interface RoomUtilizationReportResponse {
  totalRooms: number;
  days: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  occupancyPct: number;
  averageLengthOfStayNights: number;
}

/** An arrival / departure line with booking number, guest and unit code already resolved. */
export interface ReportLineRow extends BookingUnitRow {
  bookingNumber: string | null;
  bookingType: 'room' | 'hall' | null;
  primaryGuestName: string | null;
  primaryGuestPhone: string | null;
  unitCode: string | null;
}
