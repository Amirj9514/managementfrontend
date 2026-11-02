import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressBar } from 'primeng/progressbar';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { AnnouncementReport } from '../../../../core/models/announcement.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { ANNOUNCEMENTS_DICTIONARY } from '../../announcements.dictionary';
import { AnnouncementsApiService } from '../../services/announcements-api.service';

type ReportTab = 'all' | 'pending' | 'viewed';

/** Who an announcement was aimed at, and who has / hasn't read it. */
@Component({
  selector: 'app-announcement-report',
  imports: [
    DatePipe,
    FormsModule,
    Button,
    Card,
    ProgressBar,
    SelectButton,
    Skeleton,
    TableModule,
    Tag,
    PageHeaderComponent,
    EmptyStateComponent,
    TranslatePipe,
  ],
  templateUrl: './announcement-report.component.html',
  styleUrl: './announcement-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementReportComponent {
  private readonly api = inject(AnnouncementsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly report = signal<AnnouncementReport | null>(null);
  readonly loading = signal(true);
  readonly tab = signal<ReportTab>('pending');

  readonly pct = computed(() => {
    const s = this.report()?.summary;
    return s && s.total ? Math.round((s.viewed / s.total) * 100) : 0;
  });
  readonly tabOptions = computed(() => {
    const s = this.report()?.summary;
    return [
      { label: `${this.i18n.t('announcements.report.tab.pending')} (${s?.pending ?? 0})`, value: 'pending' as ReportTab },
      { label: `${this.i18n.t('announcements.report.tab.viewed')} (${s?.viewed ?? 0})`, value: 'viewed' as ReportTab },
      { label: `${this.i18n.t('announcements.report.tab.all')} (${s?.total ?? 0})`, value: 'all' as ReportTab },
    ];
  });
  readonly rows = computed(() => {
    const users = this.report()?.users ?? [];
    const tab = this.tab();
    return tab === 'all' ? users : users.filter((u) => (tab === 'viewed' ? u.viewed : !u.viewed));
  });

  constructor() {
    this.i18n.register(ANNOUNCEMENTS_DICTIONARY);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.report(this.id).subscribe({
      next: (r) => {
        this.report.set(r);
        // Land on whichever list is useful: people still to read it, else everyone.
        if (this.tab() === 'pending' && r.summary.pending === 0) this.tab.set('all');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/announcements/manage']);
      },
    });
  }

  onTab(tab: ReportTab | null): void {
    if (tab) this.tab.set(tab);
  }

  back(): void {
    void this.router.navigate(['/announcements/manage']);
  }

  edit(): void {
    void this.router.navigate(['/announcements', this.id, 'edit']);
  }
}
