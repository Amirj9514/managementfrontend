import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type { AuditFacets, AuditFilter, AuditRow } from '../../../core/models/audit.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly api = inject(ApiClientService);

  list(filter: AuditFilter, page = 1, limit = 25): Observable<PaginatedListPayload<AuditRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (filter.search) params = params.set('search', filter.search);
    if (filter.module) params = params.set('module', filter.module);
    if (filter.actorId) params = params.set('actorId', filter.actorId);
    if (filter.kind && filter.kind !== 'all') params = params.set('kind', filter.kind);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    return this.api.getPaginatedList<AuditRow>('audit-logs', params);
  }

  get(id: string): Observable<AuditRow> {
    return this.api.get<AuditRow>(`audit-logs/${id}`);
  }

  facets(): Observable<AuditFacets> {
    return this.api.get<AuditFacets>('audit-logs/facets');
  }
}
