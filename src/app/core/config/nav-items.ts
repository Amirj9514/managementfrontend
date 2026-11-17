import { AUDIT_ROLES, USER_ADMIN_ROLES, type UserRole } from '../models/roles.model';

export interface NavItem {
  /** Translation key (see core/i18n/dictionaries/nav.dictionary.ts), not a literal label. */
  label: string;
  routerLink: string;
  /** Lucide icon name registered with provideIcons (e.g. lucideLayoutDashboard) */
  icon: string;
  /** Shown when the user holds at least one of these permissions (admins always see it). */
  permissions?: readonly string[];
  /** Role allow-list for admin-only screens that have no configurable permission. */
  roles?: readonly UserRole[];
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'nav.group.overview',
    items: [
      {
        label: 'nav.dashboard',
        routerLink: '/dashboard',
        icon: 'lucideLayoutDashboard',
        permissions: ['dashboard.view'],
      },
      {
        // No permissions/roles: every signed-in user gets their announcements.
        label: 'nav.announcements',
        routerLink: '/announcements',
        icon: 'lucideMegaphone',
      },
    ],
  },
  {
    label: 'nav.group.operations',
    items: [
      {
        label: 'nav.bookings',
        routerLink: '/bookings',
        icon: 'lucideCalendarCheck',
        permissions: ['bookings.view'],
      },
      {
        label: 'nav.guests',
        routerLink: '/guests',
        icon: 'lucideUsers',
        permissions: ['guests.view'],
      },
      {
        label: 'nav.checkout',
        routerLink: '/stays',
        icon: 'lucideBedDouble',
        permissions: ['checkout.view'],
      },
      {
        label: 'nav.housekeeping',
        routerLink: '/housekeeping',
        icon: 'lucideSparkles',
        permissions: ['housekeeping.view', 'housekeeping.assign', 'housekeeping.clean', 'housekeeping.verify'],
      },
    ],
  },
  {
    label: 'nav.group.property',
    items: [
      {
        label: 'nav.branches',
        routerLink: '/branches',
        icon: 'lucideBuilding2',
        permissions: ['branches.view'],
      },
      {
        label: 'nav.rooms',
        routerLink: '/rooms',
        icon: 'lucideDoorOpen',
        permissions: ['rooms.view'],
      },
      {
        label: 'nav.halls',
        routerLink: '/halls',
        icon: 'lucideUsers',
        permissions: ['halls.view'],
      },
      {
        label: 'nav.amenities',
        routerLink: '/amenities',
        icon: 'lucideTag',
        permissions: ['amenities.view'],
      },
    ],
  },
  {
    label: 'nav.group.people',
    items: [
      {
        label: 'nav.hr',
        routerLink: '/hr/employees',
        icon: 'lucideBriefcase',
        permissions: ['hr.view'],
      },
      {
        label: 'nav.users',
        routerLink: '/users',
        icon: 'lucideUserCog',
        roles: USER_ADMIN_ROLES,
      },
    ],
  },
  {
    label: 'nav.group.insights',
    items: [
      {
        label: 'nav.reports',
        routerLink: '/reports',
        icon: 'lucideChartBar',
        permissions: ['reports.view'],
      },
    ],
  },
  {
    label: 'nav.group.system',
    items: [
      {
        label: 'nav.auditLog',
        routerLink: '/audit',
        icon: 'lucideScrollText',
        roles: AUDIT_ROLES,
      },
    ],
  },
];
