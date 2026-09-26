import { Routes } from '@angular/router';

export const staysRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Stays' },
    loadComponent: () =>
      import('./pages/stay-list/stay-list.component').then((m) => m.StayListComponent),
  },
  {
    path: ':id',
    data: { breadcrumb: 'Stay details', breadcrumbParent: { label: 'Stays', url: '/stays' } },
    loadComponent: () =>
      import('./pages/stay-shell/stay-shell.component').then((m) => m.StayShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/stay-detail/stay-detail.component').then((m) => m.StayDetailComponent),
      },
    ],
  },
];
