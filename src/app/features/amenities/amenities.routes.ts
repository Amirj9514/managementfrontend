import { Routes } from '@angular/router';

export const amenitiesRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'nav.amenities' },
    loadComponent: () =>
      import('./pages/amenity-list/amenity-list.component').then((m) => m.AmenityListComponent),
  },
];
