/** Placeholder shapes for remaining features; extend when wiring real API fields. */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface Branch {
  id?: string;
  /** Some list endpoints return Mongo-style `_id` only. */
  _id?: string;
  name: string;
  code?: string;
  createdAt?: string;
}

export interface Building {
  id: string;
  branchId: string;
  name: string;
}

export interface Stay {
  id: string;
  guestId?: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource?: string;
  userId?: string;
  createdAt: string;
}
