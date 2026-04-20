import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  FloorCreateRequest,
  FloorListRow,
  FloorUpdateRequest,
} from '../../../core/models/floor-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class FloorsApiService {
  private readonly api = inject(ApiClientService);

  list(
    buildingId: string,
    page = 1,
    limit = 100,
    status?: string,
  ): Observable<PaginatedListPayload<FloorListRow>> {
    let params = new HttpParams()
      .set('buildingId', buildingId)
      .set('page', String(page))
      .set('limit', String(limit));
    if (status) params = params.set('status', status);
    return this.api.getPaginatedList<FloorListRow>('floors', params);
  }

  create(body: FloorCreateRequest): Observable<FloorListRow> {
    return this.api.post<FloorListRow>('floors', body);
  }

  update(id: string, body: FloorUpdateRequest): Observable<void> {
    return this.api.patch<void>(`floors/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`floors/${id}`);
  }

  restore(id: string): Observable<void> {
    return this.api.post<void>(`floors/${id}/restore`, {});
  }

  deletePermanent(id: string): Observable<void> {
    const params = new HttpParams().set('permanent', 'true');
    return this.api.delete<void>(`floors/${id}`, params);
  }
}
