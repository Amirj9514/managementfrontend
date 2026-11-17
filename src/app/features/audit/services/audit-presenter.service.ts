import { Injectable, inject } from '@angular/core';
import { TranslationService } from '../../../core/i18n/translation.service';
import type { AuditRow } from '../../../core/models/audit.model';
import { AUDIT_DICTIONARY } from '../audit.dictionary';

export type AuditTone = 'create' | 'update' | 'delete' | 'restore' | 'move' | 'info';

export interface AuditMeta {
  icon: string;
  tone: AuditTone;
}

export interface PayloadEntry {
  label: string;
  value: string;
  /** How to draw the value: plain text, a copyable id, or a list of chips. */
  kind: 'text' | 'id' | 'list';
  items?: string[];
}

const VERB_META: Record<string, AuditMeta> = {
  create: { icon: 'pi-plus', tone: 'create' },
  add: { icon: 'pi-plus', tone: 'create' },
  register: { icon: 'pi-user-plus', tone: 'create' },
  request: { icon: 'pi-send', tone: 'create' },
  upload: { icon: 'pi-upload', tone: 'create' },
  update: { icon: 'pi-pencil', tone: 'update' },
  extend: { icon: 'pi-calendar-plus', tone: 'update' },
  review: { icon: 'pi-check-square', tone: 'update' },
  start: { icon: 'pi-play', tone: 'update' },
  complete: { icon: 'pi-check', tone: 'update' },
  verify: { icon: 'pi-verified', tone: 'create' },
  reject: { icon: 'pi-replay', tone: 'delete' },
  softDelete: { icon: 'pi-trash', tone: 'delete' },
  delete: { icon: 'pi-trash', tone: 'delete' },
  permanentDelete: { icon: 'pi-trash', tone: 'delete' },
  cancel: { icon: 'pi-times-circle', tone: 'delete' },
  cancelUnit: { icon: 'pi-times-circle', tone: 'delete' },
  restore: { icon: 'pi-undo', tone: 'restore' },
  checkIn: { icon: 'pi-sign-in', tone: 'info' },
  hallGroupCheckIn: { icon: 'pi-sign-in', tone: 'info' },
  checkOut: { icon: 'pi-sign-out', tone: 'info' },
  checkOutAll: { icon: 'pi-sign-out', tone: 'info' },
  adminCheckOut: { icon: 'pi-sign-out', tone: 'info' },
  transfer: { icon: 'pi-arrow-right-arrow-left', tone: 'move' },
  assign: { icon: 'pi-user-plus', tone: 'move' },
  unassign: { icon: 'pi-user-minus', tone: 'move' },
  updatePermissions: { icon: 'pi-key', tone: 'move' },
  updateAssignment: { icon: 'pi-id-card', tone: 'move' },
};

/** Entity types stored by the server → the noun used for them. */
const ENTITY_NOUN: Record<string, string> = {
  Booking: 'booking',
  BookingUnit: 'booking',
  Unit: 'room',
  User: 'user',
  Branch: 'branch',
  Building: 'building',
  Floor: 'floor',
  Amenity: 'amenity',
  Guest: 'guest',
  RoomType: 'roomType',
  Employee: 'employee',
  Announcement: 'announcement',
  HousekeepingTask: 'housekeeping',
  Stay: 'stay',
  Room: 'room',
  Bed: 'bed',
  LeaveRequest: 'leave',
  AttendanceRecord: 'attendance',
  AuditLog: 'auditLog',
  ErrorLog: 'errorLog',
};

const ID_RX = /^[a-f0-9]{24}$/i;
const ISO_RX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Turns a raw audit row ("booking.checkOut" + ids) into plain language: a sentence, an icon and colour,
 * a "what this means" line, readable field names and a friendly time. All wording lives in the dictionary.
 */
@Injectable({ providedIn: 'root' })
export class AuditPresenter {
  private readonly i18n = inject(TranslationService);

  constructor() {
    this.i18n.register(AUDIT_DICTIONARY);
  }

  private t(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }

  /** Translation if the key exists, else null (the service returns the key itself when missing). */
  private maybe(key: string, params?: Record<string, string | number>): string | null {
    const v = this.t(key, params);
    return v === key ? null : v;
  }

  parts(action: string): { module: string; mid: string | null; verb: string } {
    const seg = action.split('.');
    return { module: seg[0], verb: seg[seg.length - 1], mid: seg.length > 2 ? seg[1] : null };
  }

  meta(action: string): AuditMeta {
    return VERB_META[this.parts(action).verb] ?? { icon: 'pi-circle', tone: 'update' };
  }

  private noun(action: string): string {
    const { module, mid } = this.parts(action);
    return this.maybe('audit.noun.' + (mid ?? module)) ?? this.t('audit.noun.generic');
  }

  /** "Checked out", "Created a booking"… */
  label(row: Pick<AuditRow, 'action'>): string {
    const { verb } = this.parts(row.action);
    const noun = this.noun(row.action);
    return this.maybe('audit.verb.' + verb, { noun }) ?? `${this.humanize(verb)} · ${noun}`;
  }

  /** The "what this means" sentence shown in the details. */
  help(row: Pick<AuditRow, 'action'>): string {
    const { verb } = this.parts(row.action);
    return this.maybe('audit.help.' + verb, { noun: this.noun(row.action).replace(/^(an?|the) /, '') }) ?? this.t('audit.help.generic');
  }

  moduleLabel(module: string): string {
    return this.maybe('audit.module.' + module) ?? this.humanize(module);
  }

  /** What kind of thing the record is ("Booking", "Room") for the details panel. */
  entityLabel(entityType: string): string {
    const n = this.maybe('audit.noun.' + (ENTITY_NOUN[entityType] ?? ''));
    return (n ?? this.humanize(entityType)).replace(/^(an?|the) /, '').replace(/^./, (c) => c.toUpperCase());
  }

  /** The name of what was touched, or the area when it no longer exists. */
  target(row: AuditRow): string {
    return row.targetLabel || '';
  }

  humanize(key: string): string {
    const s = key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/Ids?$/, '')
      .replace(/[_.-]+/g, ' ')
      .trim()
      .toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  fieldLabel(key: string): string {
    return this.maybe('audit.field.' + key) ?? this.humanize(key);
  }

  // ---- when
  private locale(): string {
    return this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB';
  }

  /** "Today, 3:41 pm" · "Yesterday, 9:02 am" · "12 Nov, 3:41 pm". */
  when(iso: string): string {
    const d = new Date(iso);
    const time = new Intl.DateTimeFormat(this.locale(), { hour: 'numeric', minute: '2-digit' }).format(d);
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
    if (days === 0) return `${this.t('audit.today')}, ${time}`;
    if (days === 1) return `${this.t('audit.yesterday')}, ${time}`;
    const date = new Intl.DateTimeFormat(this.locale(), { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).format(d);
    return `${date}, ${time}`;
  }

  whenFull(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full', timeStyle: 'medium' }).format(new Date(iso));
  }

  relative(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    const fmt = new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' });
    const mins = Math.round(diff / 60000);
    if (Math.abs(mins) < 60) return fmt.format(mins, 'minute');
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return fmt.format(hours, 'hour');
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 60) return fmt.format(days, 'day');
    return fmt.format(Math.round(days / 30), 'month');
  }

  /** IPv4 addresses arrive wrapped as "::ffff:1.2.3.4"; show them plainly. */
  ip(ip: string | null): string {
    return ip ? ip.replace(/^::ffff:/i, "") : this.t("audit.detail.notRecorded");
  }

  // ---- device
  device(ua: string | null): string {
    if (!ua) return this.t('audit.detail.notRecorded');
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    return browser && os ? `${browser} · ${os}` : browser || os || ua.slice(0, 60);
  }

  // ---- payload
  /** The submitted values as label/value rows (nested objects flatten to "Capacity · Adults"). */
  entries(payload: unknown): PayloadEntry[] {
    const out: PayloadEntry[] = [];
    if (payload === null || typeof payload !== 'object') return out;
    const walk = (obj: Record<string, unknown>, prefix: string, depth: number): void => {
      for (const [key, val] of Object.entries(obj)) {
        const label = (prefix ? prefix + ' · ' : '') + this.fieldLabel(key);
        if (val !== null && typeof val === 'object' && !Array.isArray(val) && depth < 2) {
          walk(val as Record<string, unknown>, label, depth + 1);
        } else {
          out.push(this.entry(label, val));
        }
      }
    };
    if (Array.isArray(payload)) out.push(this.entry(this.t('audit.detail.changes'), payload));
    else walk(payload as Record<string, unknown>, '', 0);
    return out;
  }

  private entry(label: string, val: unknown): PayloadEntry {
    if (Array.isArray(val)) {
      const items = val.map((v) => this.scalar(v));
      if (items.length === 0) return { label, value: this.t('audit.empty'), kind: 'text' };
      return { label, value: this.t('audit.detail.items', { n: items.length }), kind: 'list', items: items.slice(0, 40) };
    }
    if (val !== null && typeof val === 'object') return { label, value: JSON.stringify(val), kind: 'text' };
    if (typeof val === 'string' && ID_RX.test(val)) return { label, value: val, kind: 'id' };
    return { label, value: this.scalar(val), kind: 'text' };
  }

  private scalar(v: unknown): string {
    if (v === null || v === undefined || v === '') return this.t('audit.empty');
    if (typeof v === 'boolean') return this.t(v ? 'audit.yes' : 'audit.no');
    if (typeof v === 'string' && ISO_RX.test(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    }
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }
}
