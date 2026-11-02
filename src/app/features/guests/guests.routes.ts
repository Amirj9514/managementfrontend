import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const guestsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['guests.view'], breadcrumb: 'nav.guests' },
    loadComponent: () =>
      import('./pages/guest-list/guest-list.component').then((m) => m.GuestListComponent),
  },
  {
    path: ':guestId',
    canActivate: [permissionGuard],
    data: { permissions: ['guests.detail'], breadcrumb: 'nav.guestDetails', breadcrumbParent: { label: 'nav.guests', url: '/guests' } },
    loadComponent: () =>
      import('./pages/guest-detail/guest-detail.component').then((m) => m.GuestDetailComponent),
  },
];
