/** Shapes aligned with managementBackend /room-types routes. */

export type RoomTypeCategory = 'single' | 'double' | 'family' | 'shared_dorm' | 'suite' | 'other';

export interface RoomTypeRow {
  _id: string;
  branchId?: string | null;
  name: string;
  category: RoomTypeCategory;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  allowsShared: boolean;
  deletedAt?: string | null;
}

export interface RoomTypeCreateRequest {
  branchId?: string | null;
  name: string;
  category: RoomTypeCategory;
  maxAdults: number;
  maxChildren?: number;
  maxOccupancy: number;
  allowsShared?: boolean;
}

export type RoomTypeUpdateRequest = Partial<RoomTypeCreateRequest>;

export const ROOM_TYPE_CATEGORY_OPTIONS: { label: string; value: RoomTypeCategory }[] = [
  { label: 'Single', value: 'single' },
  { label: 'Double', value: 'double' },
  { label: 'Family', value: 'family' },
  { label: 'Shared dorm', value: 'shared_dorm' },
  { label: 'Suite', value: 'suite' },
  { label: 'Other', value: 'other' },
];
