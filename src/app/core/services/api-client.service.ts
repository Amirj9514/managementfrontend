import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiErrorBody,
  ApiPaginatedListResponse,
  ApiResponse,
  PaginatedListPayload,
} from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);

  unwrap<T>(body: ApiResponse<T>): T {
    if (!body.success) {
      throw new Error(body.message || 'Request failed');
    }
    return body.data;
  }

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${environment.apiUrl}/${path}`, { params })
      .pipe(map((b) => this.unwrap(b)));
  }

  /** GET where the envelope includes top-level `pagination` (e.g. users list). */
  getPaginatedList<T>(path: string, params?: HttpParams): Observable<PaginatedListPayload<T>> {
    return this.http
      .get<ApiPaginatedListResponse<T> | ApiErrorBody>(`${environment.apiUrl}/${path}`, { params })
      .pipe(
        map((b) => {
          if (!b.success) {
            throw new Error(b.message || 'Request failed');
          }
          return { items: b.data, pagination: b.pagination };
        }),
      );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${environment.apiUrl}/${path}`, body).pipe(map((b) => this.unwrap(b)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${environment.apiUrl}/${path}`, body)
      .pipe(map((b) => this.unwrap(b)));
  }

  delete<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${environment.apiUrl}/${path}`, { params })
      .pipe(map((b) => this.unwrap(b)));
  }
}
