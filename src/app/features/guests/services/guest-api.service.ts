import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PaginatedListPayload, PaginatedResult } from '../../../core/models/api.types';
import type { Guest, GuestPayload, GuestSearchParams } from '../../../core/models/guest.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class GuestApiService {
  private readonly api = inject(ApiClientService);

  /** Plain array — used by the guest picker's search-as-you-type autocomplete. */
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

  /** Paginated — used by the guest management list page. */
  listPaginated(
    params: GuestSearchParams & { status?: string },
    page = 1,
    limit = 20,
  ): Observable<PaginatedListPayload<Guest>> {
    let hp = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (params.q) hp = hp.set('q', params.q);
    if (params.status) hp = hp.set('status', params.status);
    return this.api.getPaginatedList<Guest>('guests', hp);
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

  restore(id: string): Observable<void> {
    return this.api.post<void>(`guests/${id}/restore`, {});
  }

  /** Appends an entry to the guest's notes log (distinct from the single `notes` freeform field). */
  addNote(guestId: string, text: string): Observable<Guest> {
    return this.api.post<Guest>(`guests/${guestId}/notes`, { text });
  }

  deleteNote(guestId: string, noteId: string): Observable<Guest> {
    return this.api.delete<Guest>(`guests/${guestId}/notes/${noteId}`);
  }
}
