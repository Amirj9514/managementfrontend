import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const hrRoutes: Routes = [
  { path: '', redirectTo: 'employees', pathMatch: 'full' },
  {
    path: 'employees',
    canActivate: [permissionGuard],
    data: { permissions: ['hr.view'], breadcrumb: 'nav.hr' },
    loadComponent: () =>
      import('./pages/employee-list/employee-list.component').then((m) => m.EmployeeListComponent),
  },
];
