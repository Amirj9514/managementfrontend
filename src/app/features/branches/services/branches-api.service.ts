import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  BranchCreateRequest,
  BranchListRow,
  BranchUpdateRequest,
} from '../../../core/models/branch-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class BranchesApiService {
  private readonly api = inject(ApiClientService);

  list(
    page = 1,
    limit = 20,
    status?: string,
  ): Observable<PaginatedListPayload<BranchListRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) params = params.set('status', status);
    return this.api.getPaginatedList<BranchListRow>('branches', params);
  }

  getById(id: string): Observable<BranchListRow> {
    return this.api.get<BranchListRow>(`branches/${id}`);
  }

  create(body: BranchCreateRequest): Observable<BranchListRow> {
    return this.api.post<BranchListRow>('branches', body);
  }

  update(id: string, body: BranchUpdateRequest): Observable<void> {
    return this.api.patch<void>(`branches/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`branches/${id}`);
  }

  restore(id: string): Observable<void> {
    return this.api.post<void>(`branches/${id}/restore`, {});
  }

  deletePermanent(id: string): Observable<void> {
    const params = new HttpParams().set('permanent', 'true');
    return this.api.delete<void>(`branches/${id}`, params);
  }
}
