import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const amenitiesRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['amenities.view'], breadcrumb: 'nav.amenities' },
    loadComponent: () =>
      import('./pages/amenity-list/amenity-list.component').then((m) => m.AmenityListComponent),
  },
];
