import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  PrivateRoomCreateRequest,
  PrivateRoomRow,
  PrivateRoomUpdateRequest,
} from '../../../core/models/unit-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface RoomListFilter {
  branchId?: string;
  buildingId?: string;
  floorId?: string;
  status?: string;
  code?: string;
  /** When both are set, each row comes back annotated with `availableForRange`/`unavailableReason` for that exact date range. */
  checkInDate?: string;
  expectedCheckOut?: string;
}

@Injectable({ providedIn: 'root' })
export class RoomsApiService {
  private readonly api = inject(ApiClientService);

  list(filter: RoomListFilter, page = 1, limit = 100): Observable<PaginatedListPayload<PrivateRoomRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (filter.branchId) params = params.set('branchId', filter.branchId);
    if (filter.buildingId) params = params.set('buildingId', filter.buildingId);
    if (filter.floorId) params = params.set('floorId', filter.floorId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.code) params = params.set('code', filter.code);
    if (filter.checkInDate) params = params.set('checkInDate', filter.checkInDate);
    if (filter.expectedCheckOut) params = params.set('expectedCheckOut', filter.expectedCheckOut);
    return this.api.getPaginatedList<PrivateRoomRow>('private-rooms', params);
  }

  getById(id: string): Observable<PrivateRoomRow> {
    return this.api.get<PrivateRoomRow>(`private-rooms/${id}`);
  }

  create(body: PrivateRoomCreateRequest): Observable<PrivateRoomRow> {
    return this.api.post<PrivateRoomRow>('private-rooms', body);
  }

  update(id: string, body: PrivateRoomUpdateRequest): Observable<PrivateRoomRow> {
    return this.api.patch<PrivateRoomRow>(`private-rooms/${id}`, body);
  }

  setStatus(id: string, status: string): Observable<PrivateRoomRow> {
    return this.api.patch<PrivateRoomRow>(`private-rooms/${id}`, { status });
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`private-rooms/${id}`);
  }

  restore(id: string): Observable<void> {
    return this.api.post<void>(`private-rooms/${id}/restore`, {});
  }
}
