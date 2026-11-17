/** Shapes aligned with the /housekeeping routes. */

/** pending → assigned → in_progress → awaiting_verification → done (the room is available again). */
export type CleaningStatus = 'pending' | 'assigned' | 'in_progress' | 'awaiting_verification' | 'done' | 'cancelled';

export interface CleaningTask {
  _id: string;
  status: CleaningStatus;
  source: 'checkout' | 'transfer' | 'manual';
  note: string | null;
  unitId: string;
  unitCode: string;
  roomTypeName: string | null;
  buildingId: string | null;
  buildingName: string | null;
  floorId: string;
  floorLabel: string | null;
  floorOrder: number;
  /** Typed name of whoever cleans it — cleaners do not need an account. */
  cleanerName: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  cleanedAt: string | null;
  cleanerNote: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  /** How many times a supervisor sent this room back. */
  redoCount: number;
  lastRejectionNote: string | null;
  /** When the room started waiting for cleaning. */
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CleaningCounts {
  pending: number;
  assigned: number;
  in_progress: number;
  awaiting_verification: number;
  done: number;
}

export interface CleaningBoard {
  tasks: CleaningTask[];
  counts: CleaningCounts;
}

/** A cleaner name already used in this branch, offered as a suggestion. */
export interface Cleaner {
  name: string;
  openTasks: number;
}
