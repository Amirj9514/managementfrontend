import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  BuildingCreateRequest,
  BuildingListRow,
  BuildingUpdateRequest,
} from '../../../core/models/building-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class BuildingsApiService {
  private readonly api = inject(ApiClientService);

  list(
    page = 1,
    limit = 20,
    status?: string,
    branchId?: string,
  ): Observable<PaginatedListPayload<BuildingListRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) params = params.set('status', status);
    if (branchId) params = params.set('branchId', branchId);
    return this.api.getPaginatedList<BuildingListRow>('buildings', params);
  }

  getById(id: string): Observable<BuildingListRow> {
    return this.api.get<BuildingListRow>(`buildings/${id}`);
  }

  create(body: BuildingCreateRequest): Observable<BuildingListRow> {
    return this.api.post<BuildingListRow>('buildings', body);
  }

  update(id: string, body: BuildingUpdateRequest): Observable<void> {
    return this.api.patch<void>(`buildings/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`buildings/${id}`);
  }

  restore(id: string): Observable<void> {
    return this.api.post<void>(`buildings/${id}/restore`, {});
  }

  deletePermanent(id: string): Observable<void> {
    const params = new HttpParams().set('permanent', 'true');
    return this.api.delete<void>(`buildings/${id}`, params);
  }
}
