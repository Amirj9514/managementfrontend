export const USER_ROLES = [
  'super_admin',
  'admin',
  'branch_admin',
  'building_admin',
  'booking_admin',
  'employee_admin',
  'front_desk',
  'housekeeping',
  'staff',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Same set as backend `STAFF_ROLES` — no dedicated API; keep in sync. */
export const STAFF_ROLES = USER_ROLES;

function staffRoleLabel(slug: string): string {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Options for staff role dropdowns (create user, assignment). */
export const STAFF_ROLE_OPTIONS: { label: string; value: UserRole }[] = USER_ROLES.map((value) => ({
  value,
  label: staffRoleLabel(value),
}));

/** Guest list / read — align with typical backend visibility */
export const GUEST_READ_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'branch_admin',
  'building_admin',
  'booking_admin',
  'front_desk',
  'housekeeping',
  'staff',
];

/** Create / update guests */
export const GUEST_WRITE_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'branch_admin',
  'booking_admin',
  'front_desk',
];

/** Delete guests — excludes front_desk and booking_admin per plan */
export const GUEST_DELETE_ROLES: readonly UserRole[] = ['super_admin', 'admin', 'branch_admin'];

export const USER_ADMIN_ROLES: readonly UserRole[] = ['super_admin', 'admin'];

export const AUDIT_ROLES: readonly UserRole[] = ['super_admin', 'admin'];

export const BRANCH_ADMIN_ROLES: readonly UserRole[] = ['super_admin', 'admin', 'branch_admin'];
