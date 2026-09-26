import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import type { UserRole } from '../../core/models/roles.model';

const HR_ROLES: readonly UserRole[] = ['super_admin', 'admin', 'employee_admin', 'branch_admin'];

export const hrRoutes: Routes = [
  { path: '', redirectTo: 'employees', pathMatch: 'full' },
  {
    path: 'employees',
    canActivate: [roleGuard],
    data: { roles: HR_ROLES, breadcrumb: 'HR' },
    loadComponent: () =>
      import('./pages/employee-list/employee-list.component').then((m) => m.EmployeeListComponent),
  },
];
