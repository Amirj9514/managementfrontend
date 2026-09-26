/** Shapes aligned with managementBackend /reports/* routes. */

export interface OccupancyDayRow {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyPct: number;
}

export interface HallOccupancyDayRow {
  date: string;
  occupied: number;
  remaining: number;
}

export interface HallOccupancyReportRow {
  hallId: string;
  code: string;
  maxCapacity: number;
  perDay: HallOccupancyDayRow[];
}

export interface RoomUtilizationReportResponse {
  totalRooms: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  occupancyPct: number;
  averageLengthOfStayNights: number;
}
