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
  /** What the branch holds (list endpoint only). */
  stats?: { buildings: number; floors: number; rooms: number; freeRooms: number; halls: number };
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
