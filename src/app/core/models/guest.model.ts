/** Shapes aligned with managementBackend /guests routes (Guest model is fullName-based, not firstName/lastName). */

/** One free-text note logged against a guest (e.g. a front-desk observation) — distinct from
 *  the single freeform `notes` string captured at guest creation. */
export interface GuestNoteEntry {
  _id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Guest {
  _id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  cnic?: string | null;
  address?: string | null;
  country?: string | null;
  state?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  notesLog?: GuestNoteEntry[];
  bookingCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GuestSearchParams {
  q?: string;
  /** 'identity' = match `q` against phone / CNIC / passport only (never name or email). */
  searchBy?: 'all' | 'identity';
  email?: string;
  phone?: string;
  cnic?: string;
  page?: number;
  limit?: number;
}

export interface GuestPayload {
  fullName: string;
  email?: string;
  phone?: string;
  cnic?: string;
  address?: string;
  country?: string;
  state?: string;
  dateOfBirth?: string;
  notes?: string;
}

export function guestRowId(row: Guest): string {
  return row._id;
}
