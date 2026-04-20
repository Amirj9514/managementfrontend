import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import type { UserRole } from '../../core/models/roles.model';

const RATE_PLAN_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'branch_admin',
  'booking_admin',
];

export const ratePlansRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: RATE_PLAN_ROLES },
    loadComponent: () =>
      import('./pages/rate-plan-list/rate-plan-list.component').then((m) => m.RatePlanListComponent),
  },
];
