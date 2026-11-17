/** Shapes aligned with managementBackend user admin routes (POST/PATCH/GET users). */

export interface AdminUserListRow {
  _id: string;
  email: string;
  name?: string | null;
  role: string;
  status: string;
  /** Effective permissions (configured list, or the role's defaults when never customised). */
  permissions?: string[];
  createdAt: string;
  deletedAt?: string | null;
  lastLoginAt?: string | null;
  /** Where the person works (names), for the list. */
  scope?: { branches: string[]; buildings: string[]; floorCount: number };
}

export interface UserUpdateRequest {
  email?: string;
  name?: string;
  status?: 'active' | 'inactive';
  password?: string;
  role?: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  name?: string;
  role: string;
  permissions?: string[];
  assignment?: {
    branchIds: string[];
    buildingIds: string[];
    floorIds: string[];
  };
}

export interface CreatedUserResponse {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface UserAssignmentPatchRequest {
  role?: string;
  branchIds?: string[];
  buildingIds?: string[];
  floorIds?: string[];
}

export function adminUserRowId(row: AdminUserListRow): string {
  return row._id;
}

/** Comma-separated Mongo-style ids from a single-line input. */
export function parseIdListCsv(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
