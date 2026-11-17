/** Shapes aligned with GET /audit-logs, /audit-logs/:id and /audit-logs/facets. */

export interface AuditActor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditRow {
  _id: string;
  createdAt: string;
  /** e.g. "booking.checkOut" */
  action: string;
  /** First part of the action: "booking". */
  module: string;
  entityType: string;
  entityId: string | null;
  /** Readable name of what was touched ("BK-0012 · 101", "Ali Khan"); null when it no longer exists. */
  targetLabel: string | null;
  actor: AuditActor | null;
  /** What was submitted with the action (secrets already masked by the server). */
  payload: unknown;
  requestId: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface AuditFacets {
  modules: { key: string; count: number }[];
  actors: (AuditActor & { count: number })[];
  last24h: { events: number; people: number };
}

export type AuditKind = 'all' | 'create' | 'update' | 'delete' | 'restore';
export type AuditPeriod = 'all' | 'today' | '7d' | '30d';

export interface AuditFilter {
  search?: string;
  module?: string | null;
  actorId?: string | null;
  kind?: AuditKind;
  from?: string;
  to?: string;
}
