import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const housekeepingRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: {
      permissions: ['housekeeping.view', 'housekeeping.assign', 'housekeeping.clean', 'housekeeping.verify'],
      breadcrumb: 'nav.housekeeping',
    },
    loadComponent: () =>
      import('./pages/housekeeping-board/housekeeping-board.component').then((m) => m.HousekeepingBoardComponent),
  },
];
