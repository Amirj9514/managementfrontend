import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { GUEST_WRITE_ROLES } from '../../core/models/roles.model';

export const guestsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/guest-list/guest-list.component').then((m) => m.GuestListComponent),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { roles: GUEST_WRITE_ROLES },
    loadComponent: () =>
      import('./pages/guest-form/guest-form.component').then((m) => m.GuestFormComponent),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { roles: GUEST_WRITE_ROLES },
    loadComponent: () =>
      import('./pages/guest-form/guest-form.component').then((m) => m.GuestFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/guest-detail/guest-detail.component').then((m) => m.GuestDetailComponent),
  },
];
