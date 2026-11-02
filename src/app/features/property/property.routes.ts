import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const propertyRoutes: Routes = [
  {
    path: 'buildings',
    canActivate: [permissionGuard],
    data: { permissions: ['buildings.view'], breadcrumb: 'nav.buildings' },
    loadComponent: () =>
      import('./pages/building-list/building-list.component').then((m) => m.BuildingListComponent),
  },
  {
    path: 'buildings/:buildingId/floors',
    canActivate: [permissionGuard],
    data: {
      permissions: ['buildings.view'],
      breadcrumb: 'nav.floors',
      breadcrumbParent: { label: 'nav.buildings', url: '/property/buildings' },
    },
    loadComponent: () =>
      import('./pages/floor-list/floor-list.component').then((m) => m.FloorListComponent),
  },
  { path: '', redirectTo: 'buildings', pathMatch: 'full' },
];
