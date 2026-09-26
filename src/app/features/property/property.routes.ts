import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { BRANCH_ADMIN_ROLES } from '../../core/models/roles.model';

export const propertyRoutes: Routes = [
  {
    path: 'buildings',
    canActivate: [roleGuard],
    data: { roles: BRANCH_ADMIN_ROLES, breadcrumb: 'Buildings' },
    loadComponent: () =>
      import('./pages/building-list/building-list.component').then((m) => m.BuildingListComponent),
  },
  {
    path: 'buildings/:buildingId/floors',
    canActivate: [roleGuard],
    data: {
      roles: BRANCH_ADMIN_ROLES,
      breadcrumb: 'Floors',
      breadcrumbParent: { label: 'Buildings', url: '/property/buildings' },
    },
    loadComponent: () =>
      import('./pages/floor-list/floor-list.component').then((m) => m.FloorListComponent),
  },
  { path: '', redirectTo: 'buildings', pathMatch: 'full' },
];
