import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription, interval } from 'rxjs';
import { ANNOUNCEMENTS_DICTIONARY } from '../../features/announcements/announcements.dictionary';
import { AnnouncementsApiService } from '../../features/announcements/services/announcements-api.service';
import { TranslationService } from '../i18n/translation.service';
import type { MyAnnouncement } from '../models/announcement.model';

/** How often an unread-announcements reminder toast appears. */
export const ANNOUNCEMENT_REMINDER_MS = 10 * 60 * 1000;
/** Key of the dedicated <p-toast> in the announcement popup (so reminders carry an action button). */
export const ANNOUNCEMENT_TOAST_KEY = 'announcement-reminder';

/**
 * Keeps the signed-in user's announcements in sync and nudges them to read them:
 *  - on login / app load, unread announcements open in a popup;
 *  - every 10 minutes, if anything is still unread, a reminder toast appears.
 * Viewing is recorded server-side so admins can see who has read what.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncementNotifierService {
  private readonly api = inject(AnnouncementsApiService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslationService);

  readonly items = signal<MyAnnouncement[]>([]);
  readonly loaded = signal(false);
  readonly unread = computed(() => this.items().filter((i) => !i.viewed));
  readonly unreadCount = computed(() => this.unread().length);
  readonly popupVisible = signal(false);

  private timer: Subscription | null = null;

  constructor() {
    this.i18n.register(ANNOUNCEMENTS_DICTIONARY);
  }

  /** Begin tracking for the signed-in user. Safe to call repeatedly. */
  start(): void {
    if (this.timer) return;
    this.refresh({ openPopup: true });
    this.timer = interval(ANNOUNCEMENT_REMINDER_MS).subscribe(() => this.refresh({ remind: true }));
  }

  /** Stop tracking (logout / leaving the app shell). */
  stop(): void {
    this.timer?.unsubscribe();
    this.timer = null;
    this.messages.clear(ANNOUNCEMENT_TOAST_KEY);
    this.items.set([]);
    this.loaded.set(false);
    this.popupVisible.set(false);
  }

  /** Reload from the server; optionally pop the dialog or show the reminder toast if anything is unread. */
  refresh(opts: { openPopup?: boolean; remind?: boolean; quiet?: boolean } = {}): void {
    this.api.mine(opts.quiet ?? !!opts.remind).subscribe({
      next: ({ items }) => {
        this.items.set(items);
        this.loaded.set(true);
        if (this.unreadCount() === 0) {
          this.popupVisible.set(false);
          return;
        }
        if (opts.openPopup) this.popupVisible.set(true);
        else if (opts.remind && !this.popupVisible()) this.remind();
      },
      error: () => this.loaded.set(true),
    });
  }

  private remind(): void {
    this.messages.clear(ANNOUNCEMENT_TOAST_KEY);
    this.messages.add({
      key: ANNOUNCEMENT_TOAST_KEY,
      severity: 'info',
      summary: this.i18n.t('announcements.reminder.title'),
      detail: this.i18n.t('announcements.reminder.detail', { count: this.unreadCount() }),
      life: 20000,
    });
  }

  /** Record these announcements as read and update local state immediately. */
  markViewed(ids: string[]): void {
    const pending = ids.filter((id) => this.items().some((i) => i._id === id && !i.viewed));
    if (!pending.length) return;
    const now = new Date().toISOString();
    this.items.update((list) => list.map((i) => (pending.includes(i._id) ? { ...i, viewed: true, viewedAt: now } : i)));
    this.api.markViewed(pending).subscribe({
      // If the server didn't take it, bring local state back in line with the truth.
      error: () => this.refresh({ quiet: true }),
    });
  }

  markAllViewed(): void {
    this.markViewed(this.unread().map((i) => i._id));
    this.popupVisible.set(false);
  }

  dismissPopup(): void {
    this.popupVisible.set(false);
  }
}
