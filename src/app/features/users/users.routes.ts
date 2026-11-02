import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { USER_ADMIN_ROLES } from '../../core/models/roles.model';

export const usersRoutes: Routes = [
  {
    path: 'new',
    canActivate: [roleGuard],
    data: {
      roles: USER_ADMIN_ROLES,
      breadcrumb: 'users.newUserHeader',
      breadcrumbParent: { label: 'nav.users', url: '/users' },
    },
    loadComponent: () =>
      import('./pages/user-create/user-create.component').then((m) => m.UserCreateComponent),
  },
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: USER_ADMIN_ROLES, breadcrumb: 'nav.users' },
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then((m) => m.UsersListComponent),
  },
];
