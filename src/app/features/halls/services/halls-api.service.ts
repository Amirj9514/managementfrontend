import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  PublicHallCreateRequest,
  PublicHallRow,
  PublicHallUpdateRequest,
} from '../../../core/models/unit-admin.model';
import type { BookingUnitRow, BookingWithLines, HallGroupCheckInRequest } from '../../../core/models/booking.model';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface HallListFilter {
  branchId?: string;
  buildingId?: string;
  floorId?: string;
  status?: string;
  /** When both are set, each row comes back with `rangeOccupancy` projected for that exact date range instead of "right now". */
  checkInDate?: string;
  expectedCheckOut?: string;
}

@Injectable({ providedIn: 'root' })
export class HallsApiService {
  private readonly api = inject(ApiClientService);

  list(filter: HallListFilter, page = 1, limit = 100): Observable<PaginatedListPayload<PublicHallRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit)).set('withOccupancy', 'true');
    if (filter.branchId) params = params.set('branchId', filter.branchId);
    if (filter.buildingId) params = params.set('buildingId', filter.buildingId);
    if (filter.floorId) params = params.set('floorId', filter.floorId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.checkInDate) params = params.set('checkInDate', filter.checkInDate);
    if (filter.expectedCheckOut) params = params.set('expectedCheckOut', filter.expectedCheckOut);
    return this.api.getPaginatedList<PublicHallRow>('public-halls', params);
  }

  getById(id: string): Observable<PublicHallRow> {
    return this.api.get<PublicHallRow>(`public-halls/${id}`);
  }

  create(body: PublicHallCreateRequest): Observable<PublicHallRow> {
    return this.api.post<PublicHallRow>('public-halls', body);
  }

  update(id: string, body: PublicHallUpdateRequest): Observable<PublicHallRow> {
    return this.api.patch<PublicHallRow>(`public-halls/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`public-halls/${id}`);
  }

  parties(hallId: string): Observable<{ current: BookingUnitRow[]; upcoming: BookingUnitRow[] }> {
    return this.api.get(`public-halls/${hallId}/parties`);
  }

  groupCheckIn(hallId: string, body: HallGroupCheckInRequest): Observable<BookingWithLines> {
    return this.api.post<BookingWithLines>(`public-halls/${hallId}/check-in`, body);
  }
}
