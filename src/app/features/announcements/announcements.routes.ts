import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { ANNOUNCEMENT_ADMIN_ROLES } from '../../core/models/announcement.model';

const adminOnly = { canActivate: [roleGuard] };

export const announcementsRoutes: Routes = [
  {
    // Everyone signed in: their own announcements.
    path: '',
    data: { breadcrumb: 'nav.announcements' },
    loadComponent: () =>
      import('./pages/announcements-feed/announcements-feed.component').then((m) => m.AnnouncementsFeedComponent),
  },
  {
    path: 'manage',
    ...adminOnly,
    data: {
      roles: ANNOUNCEMENT_ADMIN_ROLES,
      breadcrumb: 'announcements.manage.title',
      breadcrumbParent: { label: 'nav.announcements', url: '/announcements' },
    },
    loadComponent: () =>
      import('./pages/announcements-manage/announcements-manage.component').then((m) => m.AnnouncementsManageComponent),
  },
  {
    path: 'new',
    ...adminOnly,
    data: {
      roles: ANNOUNCEMENT_ADMIN_ROLES,
      breadcrumb: 'announcements.form.newTitle',
      breadcrumbParent: { label: 'announcements.manage.title', url: '/announcements/manage' },
    },
    loadComponent: () =>
      import('./pages/announcement-form/announcement-form.component').then((m) => m.AnnouncementFormComponent),
  },
  {
    path: ':id/edit',
    ...adminOnly,
    data: {
      roles: ANNOUNCEMENT_ADMIN_ROLES,
      breadcrumb: 'announcements.form.editTitle',
      breadcrumbParent: { label: 'announcements.manage.title', url: '/announcements/manage' },
    },
    loadComponent: () =>
      import('./pages/announcement-form/announcement-form.component').then((m) => m.AnnouncementFormComponent),
  },
  {
    path: ':id/report',
    ...adminOnly,
    data: {
      roles: ANNOUNCEMENT_ADMIN_ROLES,
      breadcrumb: 'announcements.report.title',
      breadcrumbParent: { label: 'announcements.manage.title', url: '/announcements/manage' },
    },
    loadComponent: () =>
      import('./pages/announcement-report/announcement-report.component').then((m) => m.AnnouncementReportComponent),
  },
];
