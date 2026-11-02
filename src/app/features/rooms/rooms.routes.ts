import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const roomsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['rooms.view'], breadcrumb: 'nav.rooms' },
    loadComponent: () => import('./pages/room-list/room-list.component').then((m) => m.RoomListComponent),
  },
];
