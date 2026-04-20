import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PaginatedResult } from '../../../core/models/api.types';
import type { Employee } from '../../../core/models/entity-stubs.model';
import { ApiClientService } from '../../../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class EmployeesApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<Employee[]> {
    return this.api.get<Employee[] | PaginatedResult<Employee>>('employees').pipe(
      map((data) => (Array.isArray(data) ? data : (data.items ?? []))),
    );
  }
}
