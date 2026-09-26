import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type { AmenityRequest, AmenityRow } from '../../../core/models/unit-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class AmenitiesApiService {
  private readonly api = inject(ApiClientService);

  list(page = 1, limit = 100, branchId?: string): Observable<PaginatedListPayload<AmenityRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (branchId) params = params.set('branchId', branchId);
    return this.api.getPaginatedList<AmenityRow>('amenities', params);
  }

  create(body: AmenityRequest): Observable<AmenityRow> {
    return this.api.post<AmenityRow>('amenities', body);
  }

  update(id: string, body: Partial<AmenityRequest>): Observable<AmenityRow> {
    return this.api.patch<AmenityRow>(`amenities/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`amenities/${id}`);
  }
}
