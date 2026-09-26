import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type {
  HallOccupancyReportRow,
  OccupancyDayRow,
  RoomUtilizationReportResponse,
} from '../../../core/models/report.model';
import type { BookingUnitRow } from '../../../core/models/booking.model';
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

  arrivals(branchId: string, date?: string): Observable<BookingUnitRow[]> {
    let params = new HttpParams().set('branchId', branchId);
    if (date) params = params.set('date', date);
    return this.api.get<BookingUnitRow[]>('reports/arrivals', params);
  }

  departures(branchId: string, date?: string): Observable<BookingUnitRow[]> {
    let params = new HttpParams().set('branchId', branchId);
    if (date) params = params.set('date', date);
    return this.api.get<BookingUnitRow[]>('reports/departures', params);
  }

  utilization(branchId: string, range?: DateRange): Observable<RoomUtilizationReportResponse> {
    return this.api.get<RoomUtilizationReportResponse>('reports/utilization', this.rangeParams(branchId, range));
  }
}
