import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const reportsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['reports.view'], breadcrumb: 'nav.reports' },
    loadComponent: () =>
      import('./pages/reports-overview/reports-overview.component').then((m) => m.ReportsOverviewComponent),
  },
];
