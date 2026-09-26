import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  BookingCreateRequest,
  BookingRow,
  BookingUnitRow,
  BookingWithLines,
} from '../../../core/models/booking.model';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface BookingListFilter {
  branchId?: string;
  guestId?: string;
  status?: string;
  bookingType?: string;
  bookingNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  private readonly api = inject(ApiClientService);
  // Document downloads need the raw blob body (not the { success, data } envelope every other
  // endpoint returns), so that one call goes straight through HttpClient instead of
  // ApiClientService — the auth interceptor still attaches the bearer token either way.
  private readonly http = inject(HttpClient);

  list(filter: BookingListFilter, page = 1, limit = 20): Observable<PaginatedListPayload<BookingRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (filter.branchId) params = params.set('branchId', filter.branchId);
    if (filter.guestId) params = params.set('guestId', filter.guestId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.bookingType) params = params.set('bookingType', filter.bookingType);
    if (filter.bookingNumber) params = params.set('bookingNumber', filter.bookingNumber);
    return this.api.getPaginatedList<BookingRow>('bookings', params);
  }

  getById(id: string): Observable<BookingWithLines> {
    return this.api.get<BookingWithLines>(`bookings/${id}`);
  }

  create(body: BookingCreateRequest): Observable<BookingWithLines> {
    return this.api.post<BookingWithLines>('bookings', body);
  }

  checkIn(bookingId: string, lineId: string): Observable<BookingUnitRow> {
    return this.api.post<BookingUnitRow>(`bookings/${bookingId}/units/${lineId}/check-in`, {});
  }

  checkOut(bookingId: string, lineId: string): Observable<BookingUnitRow> {
    return this.api.post<BookingUnitRow>(`bookings/${bookingId}/units/${lineId}/check-out`, {});
  }

  extend(bookingId: string, lineId: string, expectedCheckOut: string): Observable<BookingUnitRow> {
    return this.api.patch<BookingUnitRow>(`bookings/${bookingId}/units/${lineId}/extend`, { expectedCheckOut });
  }

  cancelUnit(bookingId: string, lineId: string, reason?: string): Observable<BookingUnitRow> {
    return this.api.post<BookingUnitRow>(`bookings/${bookingId}/units/${lineId}/cancel`, { reason });
  }

  cancelBooking(bookingId: string, reason?: string): Observable<BookingRow> {
    return this.api.post<BookingRow>(`bookings/${bookingId}/cancel`, { reason });
  }

  transfer(bookingId: string, lineId: string, toUnitId: string, reason?: string): Observable<BookingUnitRow> {
    return this.api.post<BookingUnitRow>(`bookings/${bookingId}/units/${lineId}/transfer`, { toUnitId, reason });
  }

  guestHistory(guestId: string, page = 1, limit = 20): Observable<PaginatedListPayload<BookingRow>> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.api.getPaginatedList<BookingRow>(`guests/${guestId}/bookings`, params);
  }

  /** Multipart upload — field name `files`, one or more at a time. Returns the updated booking. */
  uploadDocuments(bookingId: string, files: File[]): Observable<BookingRow> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }
    // No explicit Content-Type here — the browser sets the multipart boundary itself.
    return this.api.post<BookingRow>(`bookings/${bookingId}/documents`, formData);
  }

  deleteDocument(bookingId: string, documentId: string): Observable<BookingRow> {
    return this.api.delete<BookingRow>(`bookings/${bookingId}/documents/${documentId}`);
  }

  /** Raw blob body, not the usual { success, data } envelope — goes straight through HttpClient. */
  downloadDocument(bookingId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/bookings/${bookingId}/documents/${documentId}`, {
      responseType: 'blob',
    });
  }
}
