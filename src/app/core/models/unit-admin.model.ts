/** Shapes aligned with managementBackend /private-rooms, /public-halls, /amenities routes. */

export type UnitStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface UnitImage {
  url: string;
  caption?: string;
  sortOrder?: number;
}

export interface PrivateRoomCapacity {
  adults: number;
  children: number;
  total: number;
}

export interface PrivateRoomRow {
  _id: string;
  floorId: string;
  buildingId?: string | null;
  branchId?: string | null;
  unitType: 'private_room';
  code: string;
  status: UnitStatus;
  amenityIds: string[];
  images: UnitImage[];
  active: boolean;
  roomTypeId: string;
  capacity: PrivateRoomCapacity;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  /** Present only when the list was queried with checkInDate/expectedCheckOut. */
  availableForRange?: boolean;
  unavailableReason?: 'booked' | UnitStatus | null;
}

export interface PrivateRoomCreateRequest {
  floorId: string;
  roomTypeId: string;
  code: string;
  capacity: PrivateRoomCapacity;
  amenityIds?: string[];
  status?: UnitStatus;
  active?: boolean;
}

export type PrivateRoomUpdateRequest = Partial<PrivateRoomCreateRequest>;

export interface HallOccupancySnapshot {
  maxCapacity: number;
  occupied: number;
  remaining: number;
}

export interface PublicHallRow {
  _id: string;
  floorId: string;
  buildingId?: string | null;
  branchId?: string | null;
  unitType: 'public_hall';
  code: string;
  status: UnitStatus;
  amenityIds: string[];
  images: UnitImage[];
  active: boolean;
  maxCapacity: number;
  occupancy?: HallOccupancySnapshot;
  /** Present only when the list was queried with checkInDate/expectedCheckOut — occupancy projected for that specific range, not "right now". */
  rangeOccupancy?: HallOccupancySnapshot;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface PublicHallCreateRequest {
  floorId: string;
  code: string;
  maxCapacity: number;
  amenityIds?: string[];
  status?: UnitStatus;
  active?: boolean;
}

export type PublicHallUpdateRequest = Partial<PublicHallCreateRequest>;

export interface AmenityRow {
  _id: string;
  branchId?: string | null;
  name: string;
  icon?: string | null;
  category?: string | null;
  active: boolean;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface AmenityRequest {
  branchId?: string | null;
  name: string;
  icon?: string;
  category?: string;
  active?: boolean;
}

export function unitRowId(row: { _id: string }): string {
  return row._id;
}

export const UNIT_STATUS_OPTIONS: { label: string; value: UnitStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Maintenance', value: 'maintenance' },
];

export function unitStatusSeverity(status: UnitStatus): 'success' | 'info' | 'warn' | 'danger' {
  switch (status) {
    case 'available':
      return 'success';
    case 'occupied':
      return 'info';
    case 'cleaning':
      return 'warn';
    case 'maintenance':
      return 'danger';
  }
}
