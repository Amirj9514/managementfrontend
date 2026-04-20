import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PaginatedResult } from '../../../core/models/api.types';
import type { AuditLogEntry } from '../../../core/models/entity-stubs.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<AuditLogEntry[]> {
    return this.api.get<AuditLogEntry[] | PaginatedResult<AuditLogEntry>>('audit-logs').pipe(
      map((data) => (Array.isArray(data) ? data : (data.items ?? []))),
    );
  }
}
