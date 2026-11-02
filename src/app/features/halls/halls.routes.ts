import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const hallsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['halls.view'], breadcrumb: 'nav.halls' },
    loadComponent: () => import('./pages/hall-board/hall-board.component').then((m) => m.HallBoardComponent),
  },
];
