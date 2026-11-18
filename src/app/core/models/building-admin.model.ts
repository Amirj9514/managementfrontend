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
  /** Floors, rooms, halls and free rooms (list endpoint only). */
  stats?: { floors: number; rooms: number; freeRooms: number; halls: number };
  /** The first few floor names, for a quick preview on the card. */
  floorLabels?: string[];
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
