import { Routes } from '@angular/router';

export const guestsRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Guests' },
    loadComponent: () =>
      import('./pages/guest-list/guest-list.component').then((m) => m.GuestListComponent),
  },
  {
    path: ':guestId',
    data: { breadcrumb: 'Guest details', breadcrumbParent: { label: 'Guests', url: '/guests' } },
    loadComponent: () =>
      import('./pages/guest-detail/guest-detail.component').then((m) => m.GuestDetailComponent),
  },
];
