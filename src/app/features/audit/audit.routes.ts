import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { AUDIT_ROLES } from '../../core/models/roles.model';

export const auditRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: AUDIT_ROLES, breadcrumb: 'Audit log' },
    loadComponent: () =>
      import('./pages/audit-list/audit-list.component').then((m) => m.AuditListComponent),
  },
];
