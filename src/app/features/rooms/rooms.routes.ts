import { Routes } from '@angular/router';

export const roomsRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Rooms' },
    loadComponent: () => import('./pages/room-list/room-list.component').then((m) => m.RoomListComponent),
  },
];
