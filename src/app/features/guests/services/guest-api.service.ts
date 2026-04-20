import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import type { PaginatedResult } from '../../../core/models/api.types';
import type { Guest, GuestPayload, GuestSearchParams } from '../../../core/models/guest.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class GuestApiService {
  private readonly api = inject(ApiClientService);

  list(params: GuestSearchParams): Observable<Guest[]> {
    let hp = new HttpParams();
    if (params.q) {
      hp = hp.set('q', params.q);
    }
    if (params.page != null) {
      hp = hp.set('page', String(params.page));
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.api.get<Guest[] | PaginatedResult<Guest>>('guests', hp).pipe(
      map((data) => (Array.isArray(data) ? data : (data.items ?? []))),
    );
  }

  getById(id: string): Observable<Guest> {
    return this.api.get<Guest>(`guests/${id}`);
  }

  create(body: GuestPayload): Observable<Guest> {
    return this.api.post<Guest>('guests', body);
  }

  update(id: string, body: Partial<GuestPayload>): Observable<Guest> {
    return this.api.patch<Guest>(`guests/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<null>(`guests/${id}`).pipe(map(() => undefined));
  }
}
