import type { AuthUser } from './user.model';

/** One screen/feature and the actions that can be granted on it (served by GET /meta/permissions). */
export interface PermissionModule {
  module: string;
  actions: string[];
}

export interface PermissionCatalog {
  modules: PermissionModule[];
  /** Permissions each role gets until an admin customises a user — used to pre-fill the editor. */
  roleDefaults: Record<string, string[]>;
}

/** super_admin and admin always see and do everything; permissions only apply to everyone else. */
export function hasFullAccess(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'admin';
}

/** Any-of check against a user's effective permissions. */
export function userCan(user: AuthUser | null | undefined, keys: readonly string[]): boolean {
  if (!user) return false;
  if (hasFullAccess(user.role)) return true;
  const held = user.permissions ?? [];
  return keys.some((k) => held.includes(k));
}
