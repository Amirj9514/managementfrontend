/** Shapes aligned with managementBackend branch admin routes. */

export interface BranchListRow {
  _id: string;
  name: string;
  code: string;
  status: string;
  city: string;
  country: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  deletedAt?: string | null;
  buildings?: any[]; // For row expansion
}

export interface BranchCreateRequest {
  name: string;
  city: string;
  country: string;
  timezone: string;
  active?: boolean;
}

export interface BranchUpdateRequest {
  name?: string;
  code?: string;
  status?: string;
  city?: string;
  country?: string;
  timezone?: string;
  active?: boolean;
}

export function branchRowId(row: BranchListRow): string {
  return row._id;
}
