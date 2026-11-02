export type AnnouncementPriority = 'normal' | 'important';
export type AnnouncementStatus = 'scheduled' | 'active' | 'expired';

export interface AnnouncementImage {
  _id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  /** Roles that see it. */
  roles: string[];
  priority: AnnouncementPriority;
  publishAt: string;
  /** null = never expires. */
  expiresAt: string | null;
  images: AnnouncementImage[];
  createdAt: string;
  updatedAt: string;
}

/** What the signed-in user sees: an announcement aimed at them, plus their own read state. */
export interface MyAnnouncement extends Announcement {
  viewed: boolean;
  viewedAt: string | null;
}

export interface MyAnnouncementsPayload {
  items: MyAnnouncement[];
  unreadCount: number;
}

/** Admin list row: audience size and how many have viewed it. */
export interface ManagedAnnouncement extends Announcement {
  status: AnnouncementStatus;
  targetCount: number;
  viewedCount: number;
}

/** Totals by state for the manage screen's summary cards. */
export interface AnnouncementSummary {
  total: number;
  active: number;
  scheduled: number;
  expired: number;
}

export interface AnnouncementReportUser {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  viewed: boolean;
  viewedAt: string | null;
}

export interface AnnouncementReport {
  announcement: {
    _id: string;
    title: string;
    roles: string[];
    publishAt: string;
    expiresAt: string | null;
    status: AnnouncementStatus;
  };
  summary: { total: number; viewed: number; pending: number };
  users: AnnouncementReportUser[];
}

export interface AnnouncementWriteRequest {
  title: string;
  body: string;
  roles: string[];
  priority?: AnnouncementPriority;
  /** null/omitted = visible right away. */
  publishAt?: string | null;
  /** null/omitted = never expires. */
  expiresAt?: string | null;
}

/** Client-side limits that mirror the server's. */
export const ANNOUNCEMENT_LIMITS = {
  titleMax: 150,
  bodyMax: 5000,
  maxImages: 10,
  imageMaxBytes: 5 * 1024 * 1024,
  imageTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const ANNOUNCEMENT_ADMIN_ROLES = ['super_admin', 'admin'] as const;
