import { Routes } from '@angular/router';

export const hallsRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Halls' },
    loadComponent: () => import('./pages/hall-board/hall-board.component').then((m) => m.HallBoardComponent),
  },
];
