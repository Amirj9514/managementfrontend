import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  RoomTypeCreateRequest,
  RoomTypeRow,
  RoomTypeUpdateRequest,
} from '../../../core/models/room-type-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class RoomTypesApiService {
  private readonly api = inject(ApiClientService);

  list(branchId?: string, page = 1, limit = 100): Observable<PaginatedListPayload<RoomTypeRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (branchId) params = params.set('branchId', branchId);
    return this.api.getPaginatedList<RoomTypeRow>('room-types', params);
  }

  create(body: RoomTypeCreateRequest): Observable<RoomTypeRow> {
    return this.api.post<RoomTypeRow>('room-types', body);
  }

  update(id: string, body: RoomTypeUpdateRequest): Observable<RoomTypeRow> {
    return this.api.patch<RoomTypeRow>(`room-types/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`room-types/${id}`);
  }

  restore(id: string): Observable<void> {
    return this.api.post<void>(`room-types/${id}/restore`, {});
  }
}
