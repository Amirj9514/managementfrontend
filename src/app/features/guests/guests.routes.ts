import { Routes } from '@angular/router';

export const guestsRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'nav.guests' },
    loadComponent: () =>
      import('./pages/guest-list/guest-list.component').then((m) => m.GuestListComponent),
  },
  {
    path: ':guestId',
    data: { breadcrumb: 'nav.guestDetails', breadcrumbParent: { label: 'nav.guests', url: '/guests' } },
    loadComponent: () =>
      import('./pages/guest-detail/guest-detail.component').then((m) => m.GuestDetailComponent),
  },
];
