import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PaginatedListPayload } from '../../../core/models/api.types';
import type {
  AdminUserListRow,
  CreatedUserResponse,
  UserAssignmentPatchRequest,
  UserCreateRequest,
  UserUpdateRequest,
} from '../../../core/models/user-admin.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly api = inject(ApiClientService);

  list(
    page = 1,
    limit = 20,
    status?: string,
  ): Observable<PaginatedListPayload<AdminUserListRow>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) params = params.set('status', status);
    return this.api.getPaginatedList<AdminUserListRow>('users', params);
  }

  create(body: UserCreateRequest): Observable<CreatedUserResponse> {
    return this.api.post<CreatedUserResponse>('users', body);
  }

  update(userId: string, body: UserUpdateRequest): Observable<void> {
    return this.api.patch<void>(`users/${userId}`, body);
  }

  delete(userId: string): Observable<void> {
    return this.api.delete<void>(`users/${userId}`);
  }

  deletePermanent(userId: string): Observable<void> {
    const params = new HttpParams().set('permanent', 'true');
    return this.api.delete<void>(`users/${userId}`, params);
  }

  restore(userId: string): Observable<void> {
    return this.api.post<void>(`users/${userId}/restore`, {});
  }

  patchAssignment(userId: string, body: UserAssignmentPatchRequest): Observable<void> {
    return this.api.patch<void>(`users/${userId}/assignment`, body);
  }
}
