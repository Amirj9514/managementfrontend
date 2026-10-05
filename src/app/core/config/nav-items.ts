import {
  AUDIT_ROLES,
  GUEST_READ_ROLES,
  USER_ADMIN_ROLES,
  type UserRole,
} from '../models/roles.model';

export interface NavItem {
  /** Translation key (see core/i18n/dictionaries/nav.dictionary.ts), not a literal label. */
  label: string;
  routerLink: string;
  /** Lucide icon name registered with provideIcons (e.g. lucideLayoutDashboard) */
  icon: string;
  roles: readonly UserRole[];
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'nav.group.overview',
    items: [
      {
        label: 'nav.dashboard',
        routerLink: '/dashboard',
        icon: 'lucideLayoutDashboard',
        roles: [
          'super_admin',
          'admin',
          'branch_admin',
          'building_admin',
          'booking_admin',
          'employee_admin',
          'front_desk',
          'housekeeping',
          'staff',
        ],
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
        roles: GUEST_READ_ROLES,
      },
      {
        label: 'nav.guests',
        routerLink: '/guests',
        icon: 'lucideUsers',
        roles: GUEST_READ_ROLES,
      },
      {
        label: 'nav.stays',
        routerLink: '/stays',
        icon: 'lucideBedDouble',
        roles: GUEST_READ_ROLES,
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
        roles: ['super_admin', 'admin', 'branch_admin', 'building_admin'],
      },
      {
        label: 'nav.rooms',
        routerLink: '/rooms',
        icon: 'lucideDoorOpen',
        roles: ['super_admin', 'admin', 'branch_admin', 'building_admin', 'booking_admin'],
      },
      {
        label: 'nav.halls',
        routerLink: '/halls',
        icon: 'lucideUsers',
        roles: ['super_admin', 'admin', 'branch_admin', 'building_admin', 'booking_admin'],
      },
      {
        label: 'nav.amenities',
        routerLink: '/amenities',
        icon: 'lucideTag',
        roles: ['super_admin', 'admin', 'branch_admin'],
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
        roles: ['super_admin', 'admin', 'employee_admin', 'branch_admin'],
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
        roles: ['super_admin', 'admin', 'branch_admin', 'booking_admin'],
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
