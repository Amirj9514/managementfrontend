import type { FloorListRow } from './floor-admin.model';

export interface BuildingListRow {
  _id: string;
  branchId: string;
  name: string;
  code: string;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  floors?: FloorListRow[];
}

export interface BuildingCreateRequest {
  branchId: string;
  name: string;
  code?: string;
  sortOrder?: number;
  status?: string;
}

export interface BuildingUpdateRequest {
  name?: string;
  code?: string;
  sortOrder?: number;
  status?: string;
}

export function buildingRowId(row: BuildingListRow): string {
  return row._id;
}
