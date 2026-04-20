import type { UserRole } from './roles.model';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponseData {
  user: AuthUser;
  token: string;
}
