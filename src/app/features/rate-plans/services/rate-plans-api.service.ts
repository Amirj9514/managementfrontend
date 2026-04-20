import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PaginatedResult } from '../../../core/models/api.types';
import type { RatePlan } from '../../../core/models/entity-stubs.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class RatePlansApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<RatePlan[]> {
    return this.api.get<RatePlan[] | PaginatedResult<RatePlan>>('rate-plans').pipe(
      map((data) => (Array.isArray(data) ? data : (data.items ?? []))),
    );
  }
}
