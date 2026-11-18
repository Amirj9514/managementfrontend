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

// ---- activity reports (GET /reports/summary | check-ins | check-outs | cleaning | guests | dashboard) ----

export type ReportGroupBy = 'day' | 'week' | 'month';

export interface ReportRangeInfo {
  from: string;
  to: string;
  days: number;
  groupBy: ReportGroupBy;
}

export interface MovementRow {
  lineId: string;
  bookingId: string;
  bookingNumber: string | null;
  guestName: string | null;
  guestPhone: string | null;
  unitCode: string | null;
  unitType: 'private_room' | 'public_hall';
  buildingName: string | null;
  floorLabel: string | null;
  /** When the check-in / check-out actually happened. */
  at: string;
  checkInDate: string;
  expectedCheckOut: string;
  plannedNights: number;
  stayNights: number | null;
  guests: number;
  late: boolean;
  lateMinutes: number | null;
}

export interface MovementReport {
  range: ReportRangeInfo;
  totals: { count: number; rooms: number; halls: number; guests: number; avgNights: number; late: number };
  series: { key: string; count: number; guests: number }[];
  byBuilding: { name: string; count: number }[];
  rows: MovementRow[];
  truncated: boolean;
}

export interface CleaningRow {
  taskId: string;
  unitCode: string | null;
  buildingName: string | null;
  floorLabel: string | null;
  source: 'checkout' | 'transfer' | 'manual';
  status: string;
  cleanerName: string | null;
  createdAt: string;
  assignedAt: string | null;
  startedAt: string | null;
  cleanedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  redoCount: number;
  cleaningMinutes: number | null;
  turnaroundMinutes: number | null;
}

export interface CleaningReport {
  range: ReportRangeInfo;
  totals: {
    requested: number;
    completed: number;
    open: number;
    avgTurnaroundMinutes: number;
    avgCleaningMinutes: number;
    redoJobs: number;
    redoRatePct: number;
  };
  series: { key: string; requested: number; completed: number }[];
  byCleaner: { name: string; jobs: number; avgCleaningMinutes: number; redos: number; open: number }[];
  rows: CleaningRow[];
  truncated: boolean;
}

export interface GuestReportRow {
  guestId: string;
  name: string;
  phone: string | null;
  cnic: string | null;
  country: string | null;
  stays: number;
  nights: number;
  people: number;
  firstVisit: string;
  lastVisit: string;
  returning: boolean;
  newlyRegistered: boolean;
}

export interface GuestsReport {
  range: ReportRangeInfo;
  totals: { uniqueGuests: number; newGuests: number; returningGuests: number; repeatRatePct: number; stays: number; avgNights: number; people: number };
  series: { key: string; arrivals: number; newGuests: number }[];
  byCountry: { name: string; count: number }[];
  rows: GuestReportRow[];
  truncated: boolean;
}

export interface SummaryTotals {
  checkIns: number;
  checkOuts: number;
  cleaned: number;
  requested: number;
  guests: number;
  occupancyPct: number;
  avgStayNights: number;
  roomNightsSold: number;
}

export interface SummaryReport {
  range: ReportRangeInfo;
  previous: { from: string; to: string };
  totals: SummaryTotals;
  previousTotals: SummaryTotals;
  series: { key: string; checkIns: number; checkOuts: number; cleaned: number; occupancyPct: number }[];
}

export interface DashboardSnapshot {
  date: string;
  rooms: { total: number; available: number; occupied: number; cleaning: number; maintenance: number; occupancyPct: number };
  today: { checkIns: number; checkOuts: number; arrivalsLeft: number; departuresLeft: number; hallsInUse: number };
  attention: { overdueCheckouts: number; pending: number; assigned: number; inProgress: number; awaitingVerification: number };
  week: { key: string; checkIns: number; checkOuts: number }[];
}
