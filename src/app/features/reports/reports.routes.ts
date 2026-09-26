import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Reports' },
    loadComponent: () =>
      import('./pages/reports-overview/reports-overview.component').then((m) => m.ReportsOverviewComponent),
  },
];
