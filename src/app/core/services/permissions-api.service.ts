import { Injectable, inject } from '@angular/core';
import { shareReplay, type Observable } from 'rxjs';
import type { PermissionCatalog } from '../models/permissions.model';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class PermissionsApiService {
  private readonly api = inject(ApiClientService);
  private catalog$?: Observable<PermissionCatalog>;

  /** Modules/actions and per-role defaults; fetched once per session. */
  getCatalog(): Observable<PermissionCatalog> {
    this.catalog$ ??= this.api.get<PermissionCatalog>('meta/permissions').pipe(shareReplay(1));
    return this.catalog$;
  }
}
