import { Routes } from '@angular/router';

export const branchesRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Branches' },
    loadComponent: () =>
      import('./pages/branch-list/branch-list.component').then((m) => m.BranchListComponent),
  },
];
