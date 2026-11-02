import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { ANNOUNCEMENT_ADMIN_ROLES } from '../../../../core/models/announcement.model';
import { AnnouncementNotifierService } from '../../../../core/services/announcement-notifier.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { SecureImageComponent } from '../../../../shared/secure-image/secure-image.component';
import { ANNOUNCEMENTS_DICTIONARY } from '../../announcements.dictionary';

type FeedTab = 'all' | 'unread';

/** Everyone's announcement feed. Opening an announcement marks it as read (and is what admins' reports count). */
@Component({
  selector: 'app-announcements-feed',
  imports: [
    DatePipe,
    FormsModule,
    Button,
    SelectButton,
    Skeleton,
    Tag,
    PageHeaderComponent,
    EmptyStateComponent,
    SecureImageComponent,
    TranslatePipe,
  ],
  templateUrl: './announcements-feed.component.html',
  styleUrl: './announcements-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsFeedComponent {
  readonly notifier = inject(AnnouncementNotifierService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly isAdmin = computed(() => this.auth.hasAnyRole(ANNOUNCEMENT_ADMIN_ROLES));
  readonly tab = signal<FeedTab>('all');
  readonly tabOptions = computed(() => [
    { label: this.i18n.t('announcements.tab.all'), value: 'all' as FeedTab },
    { label: `${this.i18n.t('announcements.tab.unread')} (${this.notifier.unreadCount()})`, value: 'unread' as FeedTab },
  ]);
  readonly shown = computed(() => (this.tab() === 'unread' ? this.notifier.unread() : this.notifier.items()));
  readonly expanded = signal<ReadonlySet<string>>(new Set());
  readonly skeletons = [1, 2, 3];

  constructor() {
    this.i18n.register(ANNOUNCEMENTS_DICTIONARY);
    this.notifier.refresh();
  }

  onTab(tab: FeedTab | null): void {
    if (tab) this.tab.set(tab);
  }

  isOpen(id: string): boolean {
    return this.expanded().has(id);
  }

  /** Expanding is the "I read this" signal: it records the view for the admin report. */
  toggle(id: string): void {
    const next = new Set(this.expanded());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      this.notifier.markViewed([id]);
    }
    this.expanded.set(next);
  }

  goManage(): void {
    void this.router.navigate(['/announcements/manage']);
  }

  goNew(): void {
    void this.router.navigate(['/announcements/new']);
  }
}
