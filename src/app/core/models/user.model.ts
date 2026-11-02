import type { UserRole } from './roles.model';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Effective feature permissions (admins/super admins bypass these). */
  permissions?: string[];
}

export interface LoginResponseData {
  user: AuthUser;
  token: string;
}
