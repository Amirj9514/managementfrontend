import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SKIP_ERROR_TOAST } from '../../../core/http/skip-error-toast';
import type { ApiResponse, PaginatedListPayload } from '../../../core/models/api.types';
import type {
  Announcement,
  AnnouncementReport,
  AnnouncementSummary,
  AnnouncementWriteRequest,
  ManagedAnnouncement,
  MyAnnouncementsPayload,
} from '../../../core/models/announcement.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class AnnouncementsApiService {
  private readonly api = inject(ApiClientService);
  // Image bytes and the quiet background poll bypass the shared JSON helpers.
  private readonly http = inject(HttpClient);

  /**
   * The signed-in user's current announcements. `quiet` suppresses the global error toast so the
   * 10-minute background check never nags about a flaky connection.
   */
  mine(quiet = false): Observable<MyAnnouncementsPayload> {
    if (!quiet) return this.api.get<MyAnnouncementsPayload>('announcements/mine');
    return this.http
      .get<ApiResponse<MyAnnouncementsPayload>>(`${environment.apiUrl}/announcements/mine`, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(map((b) => this.api.unwrap(b)));
  }

  markViewed(ids: string[]): Observable<{ marked: number }> {
    return this.api.post<{ marked: number }>('announcements/views', { ids });
  }

  // ---- admin

  list(
    status: string | undefined,
    page = 1,
    limit = 20,
    q?: string,
  ): Observable<PaginatedListPayload<ManagedAnnouncement>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) params = params.set('status', status);
    if (q) params = params.set('q', q);
    return this.api.getPaginatedList<ManagedAnnouncement>('announcements', params);
  }

  /** Totals by state, for the summary cards. */
  summary(): Observable<AnnouncementSummary> {
    return this.api.get<AnnouncementSummary>('announcements/summary');
  }

  get(id: string): Observable<ManagedAnnouncement> {
    return this.api.get<ManagedAnnouncement>(`announcements/${id}`);
  }

  create(body: AnnouncementWriteRequest): Observable<Announcement> {
    return this.api.post<Announcement>('announcements', body);
  }

  update(id: string, body: Partial<AnnouncementWriteRequest>): Observable<Announcement> {
    return this.api.patch<Announcement>(`announcements/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`announcements/${id}`);
  }

  uploadImages(id: string, files: File[]): Observable<Announcement> {
    const formData = new FormData();
    for (const file of files) formData.append('files', file, file.name);
    // No explicit Content-Type — the browser sets the multipart boundary itself.
    return this.api.post<Announcement>(`announcements/${id}/images`, formData);
  }

  deleteImage(id: string, imageId: string): Observable<Announcement> {
    return this.api.delete<Announcement>(`announcements/${id}/images/${imageId}`);
  }

  report(id: string): Observable<AnnouncementReport> {
    return this.api.get<AnnouncementReport>(`announcements/${id}/report`);
  }

  /** Raw image bytes (the endpoint is authenticated, so an <img src> can't call it directly). */
  imageBlob(id: string, imageId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/announcements/${id}/images/${imageId}`, { responseType: 'blob' });
  }
}
