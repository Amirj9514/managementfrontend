import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { USER_ADMIN_ROLES } from '../../core/models/roles.model';

export const usersRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: USER_ADMIN_ROLES, breadcrumb: 'nav.users' },
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then((m) => m.UsersListComponent),
  },
];
