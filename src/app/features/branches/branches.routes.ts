import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const branchesRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['branches.view'], breadcrumb: 'nav.branches' },
    loadComponent: () =>
      import('./pages/branch-list/branch-list.component').then((m) => m.BranchListComponent),
  },
];
