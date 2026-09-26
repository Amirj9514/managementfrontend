import {
  AUDIT_ROLES,
  GUEST_READ_ROLES,
  USER_ADMIN_ROLES,
  type UserRole,
} from '../models/roles.model';

export interface NavItem {
  label: string;
  routerLink: string;
  /** Lucide icon name registered with provideIcons (e.g. lucideLayoutDashboard) */
  icon: string;
  roles: readonly UserRole[];
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
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
    label: 'Operations',
    items: [
      {
        label: 'Bookings',
        routerLink: '/bookings',
        icon: 'lucideCalendarCheck',
        roles: GUEST_READ_ROLES,
      },
      {
        label: 'Guests',
        routerLink: '/guests',
        icon: 'lucideUsers',
        roles: GUEST_READ_ROLES,
      },
      {
        label: 'Stays',
        routerLink: '/stays',
        icon: 'lucideBedDouble',
        roles: GUEST_READ_ROLES,
      },
    ],
  },
  {
    label: 'Property',
    items: [
      {
        label: 'Branches',
        routerLink: '/branches',
        icon: 'lucideBuilding2',
        roles: ['super_admin', 'admin', 'branch_admin', 'building_admin'],
      },
      {
        label: 'Rooms',
        routerLink: '/rooms',
        icon: 'lucideDoorOpen',
        roles: ['super_admin', 'admin', 'branch_admin', 'building_admin', 'booking_admin'],
      },
      {
        label: 'Halls',
        routerLink: '/halls',
        icon: 'lucideUsers',
        roles: ['super_admin', 'admin', 'branch_admin', 'building_admin', 'booking_admin'],
      },
      {
        label: 'Amenities',
        routerLink: '/amenities',
        icon: 'lucideTag',
        roles: ['super_admin', 'admin', 'branch_admin'],
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'HR',
        routerLink: '/hr/employees',
        icon: 'lucideBriefcase',
        roles: ['super_admin', 'admin', 'employee_admin', 'branch_admin'],
      },
      {
        label: 'Users',
        routerLink: '/users',
        icon: 'lucideUserCog',
        roles: USER_ADMIN_ROLES,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Reports',
        routerLink: '/reports',
        icon: 'lucideChartBar',
        roles: ['super_admin', 'admin', 'branch_admin', 'booking_admin'],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'Audit log',
        routerLink: '/audit',
        icon: 'lucideScrollText',
        roles: AUDIT_ROLES,
      },
    ],
  },
];
