import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Cleaner, CleaningBoard, CleaningTask } from '../../../core/models/housekeeping.model';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface BoardFilter {
  branchId: string;
  buildingId?: string;
  floorId?: string;
  mine?: boolean;
}

@Injectable({ providedIn: 'root' })
export class HousekeepingApiService {
  private readonly api = inject(ApiClientService);

  board(f: BoardFilter): Observable<CleaningBoard> {
    let params = new HttpParams().set('branchId', f.branchId);
    if (f.buildingId) params = params.set('buildingId', f.buildingId);
    if (f.floorId) params = params.set('floorId', f.floorId);
    if (f.mine) params = params.set('mine', 'true');
    return this.api.get<CleaningBoard>('housekeeping/tasks', params);
  }

  cleaners(branchId: string): Observable<Cleaner[]> {
    return this.api.get<Cleaner[]>('housekeeping/cleaners', new HttpParams().set('branchId', branchId));
  }

  request(unitId: string, note?: string): Observable<CleaningTask> {
    return this.api.post<CleaningTask>('housekeeping/tasks', { unitId, note: note || undefined });
  }

  assign(taskIds: string[], cleanerName: string, note?: string): Observable<{ assigned: number; cleanerName: string }> {
    return this.api.post<{ assigned: number; cleanerName: string }>('housekeeping/tasks/assign', {
      taskIds,
      cleanerName,
      note: note || undefined,
    });
  }

  unassign(id: string): Observable<CleaningTask> {
    return this.api.post<CleaningTask>(`housekeeping/tasks/${id}/unassign`, {});
  }

  start(id: string): Observable<CleaningTask> {
    return this.api.post<CleaningTask>(`housekeeping/tasks/${id}/start`, {});
  }

  complete(id: string, note?: string): Observable<CleaningTask> {
    return this.api.post<CleaningTask>(`housekeeping/tasks/${id}/complete`, { note: note || undefined });
  }

  verify(id: string): Observable<CleaningTask> {
    return this.api.post<CleaningTask>(`housekeeping/tasks/${id}/verify`, {});
  }

  reject(id: string, note: string): Observable<CleaningTask> {
    return this.api.post<CleaningTask>(`housekeeping/tasks/${id}/reject`, { note });
  }
}
