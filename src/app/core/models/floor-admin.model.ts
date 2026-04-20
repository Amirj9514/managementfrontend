/** Shapes aligned with managementBackend floor admin routes. */

export interface FloorListRow {
  _id: string;
  buildingId: string;
  label: string;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FloorCreateRequest {
  buildingId: string;
  label: string;
  status?: string;
}

export interface FloorUpdateRequest {
  label?: string;
  status?: string;
  sortOrder?: number;
}

export function floorRowId(row: FloorListRow): string {
  return row._id;
}
