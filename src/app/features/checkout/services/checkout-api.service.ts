import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type { BookingUnitRow } from '../../../core/models/booking.model';
import { ApiClientService } from '../../../core/services/api-client.service';

/** A booked room/hall line with the booking number, guest and unit code resolved for the front-desk board. */
export interface CheckoutUnitRow extends BookingUnitRow {
  bookingNumber: string | null;
  bookingType: 'room' | 'hall' | null;
  source: string | null;
  primaryGuestName: string | null;
  primaryGuestPhone: string | null;
  unitCode: string | null;
}

export interface CheckoutUnitFilter {
  branchId: string;
  /** One or more of reserved (awaiting check-in), checked_in (in-house), checked_out — comma separated. */
  status: string;
  bookingNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly api = inject(ApiClientService);

  list(filter: CheckoutUnitFilter, page = 1, limit = 20): Observable<PaginatedListPayload<CheckoutUnitRow>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit))
      .set('branchId', filter.branchId)
      .set('status', filter.status);
    if (filter.bookingNumber) params = params.set('bookingNumber', filter.bookingNumber);
    return this.api.getPaginatedList<CheckoutUnitRow>('booking-units', params);
  }
}
