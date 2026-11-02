import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type {
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
}
