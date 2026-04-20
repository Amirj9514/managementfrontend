import { Routes } from '@angular/router';

export const staysRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/stay-list/stay-list.component').then((m) => m.StayListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/stay-shell/stay-shell.component').then((m) => m.StayShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/stay-detail/stay-detail.component').then((m) => m.StayDetailComponent),
      },
      {
        path: 'folio',
        loadComponent: () =>
          import('./pages/stay-folio/stay-folio.component').then((m) => m.StayFolioComponent),
      },
    ],
  },
];
