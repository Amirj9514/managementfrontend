import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PaginatedResult } from '../../../core/models/api.types';
import type { Stay } from '../../../core/models/entity-stubs.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class StaysApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<Stay[]> {
    return this.api.get<Stay[] | PaginatedResult<Stay>>('stays').pipe(
      map((data) => (Array.isArray(data) ? data : (data.items ?? []))),
    );
  }

  getById(id: string): Observable<Stay> {
    return this.api.get<Stay>(`stays/${id}`);
  }
}
