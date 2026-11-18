import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type {
  CleaningReport,
  DashboardSnapshot,
  GuestsReport,
  MovementReport,
  SummaryReport,
  HallOccupancyReportRow,
  OccupancyDayRow,
  ReportLineRow,
  RoomUtilizationReportResponse,
} from '../../../core/models/report.model';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface DateRange {
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly api = inject(ApiClientService);

  private rangeParams(branchId: string, range?: DateRange): HttpParams {
    let params = new HttpParams().set('branchId', branchId);
    if (range?.from) params = params.set('from', range.from);
    if (range?.to) params = params.set('to', range.to);
    return params;
  }

  occupancy(branchId: string, range?: DateRange): Observable<OccupancyDayRow[]> {
    return this.api.get<OccupancyDayRow[]>('reports/occupancy', this.rangeParams(branchId, range));
  }

  hallOccupancy(branchId: string, range?: DateRange): Observable<HallOccupancyReportRow[]> {
    return this.api.get<HallOccupancyReportRow[]>('reports/hall-occupancy', this.rangeParams(branchId, range));
  }

  /** `date` is a calendar day, "YYYY-MM-DD" (read in the branch's timezone). */
  arrivals(branchId: string, date?: string): Observable<ReportLineRow[]> {
    let params = new HttpParams().set('branchId', branchId);
    if (date) params = params.set('date', date);
    return this.api.get<ReportLineRow[]>('reports/arrivals', params);
  }

  departures(branchId: string, date?: string): Observable<ReportLineRow[]> {
    let params = new HttpParams().set('branchId', branchId);
    if (date) params = params.set('date', date);
    return this.api.get<ReportLineRow[]>('reports/departures', params);
  }

  utilization(branchId: string, range?: DateRange): Observable<RoomUtilizationReportResponse> {
    return this.api.get<RoomUtilizationReportResponse>('reports/utilization', this.rangeParams(branchId, range));
  }

  // ---- activity reports: a period (inclusive "YYYY-MM-DD" days in the branch's timezone), grouped by day/week/month ----

  summary(branchId: string, range: DateRange): Observable<SummaryReport> {
    return this.api.get<SummaryReport>('reports/summary', this.rangeParams(branchId, range));
  }

  checkIns(branchId: string, range: DateRange): Observable<MovementReport> {
    return this.api.get<MovementReport>('reports/check-ins', this.rangeParams(branchId, range));
  }

  checkOuts(branchId: string, range: DateRange): Observable<MovementReport> {
    return this.api.get<MovementReport>('reports/check-outs', this.rangeParams(branchId, range));
  }

  cleaning(branchId: string, range: DateRange): Observable<CleaningReport> {
    return this.api.get<CleaningReport>('reports/cleaning', this.rangeParams(branchId, range));
  }

  guests(branchId: string, range: DateRange): Observable<GuestsReport> {
    return this.api.get<GuestsReport>('reports/guests', this.rangeParams(branchId, range));
  }

  dashboard(branchId: string): Observable<DashboardSnapshot> {
    return this.api.get<DashboardSnapshot>('reports/dashboard', new HttpParams().set('branchId', branchId));
  }
}
