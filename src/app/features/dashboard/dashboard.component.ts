import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UIChart as Chart } from 'primeng/chart';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import type { BranchListRow } from '../../core/models/branch-admin.model';
import type { DashboardSnapshot, ReportLineRow } from '../../core/models/report.model';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { BranchesApiService } from '../branches/services/branches-api.service';
import { REPORTS_DICTIONARY } from '../reports/reports.dictionary';
import { ReportsApiService } from '../reports/services/reports-api.service';
import { REPORT_COLORS, barOptions, bucketLabel } from '../reports/reports.util';
import { DASHBOARD_DICTIONARY } from './dashboard.dictionary';

/**
 * Front desk home: how full we are right now, what is left to do today, what needs attention (late
 * check-outs, cleaning waiting on someone) and how the week looks. All numbers come from one
 * `/reports/dashboard` call so they match the Reports page; arrivals and departures lists come from the
 * existing daily endpoints.
 */
@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink, Chart, Select, Skeleton, PageHeaderComponent, StatCardComponent, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly branchesApi = inject(BranchesApiService);
  private readonly reportsApi = inject(ReportsApiService);
  readonly i18n = inject(TranslationService);
  readonly user$ = inject(AuthService).user$;

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly snapshot = signal<DashboardSnapshot | null>(null);
  readonly arrivals = signal<ReportLineRow[]>([]);
  readonly departures = signal<ReportLineRow[]>([]);
  readonly loading = signal(false);
  readonly failed = signal(false);

  /** Cleaning jobs that still need a person to act (everything but "done"). */
  readonly cleaningOpen = computed(() => {
    const a = this.snapshot()?.attention;
    return a ? a.pending + a.assigned + a.inProgress + a.awaitingVerification : 0;
  });
  readonly needsAttention = computed(() => (this.snapshot()?.attention.overdueCheckouts ?? 0) + this.cleaningOpen() > 0);

  readonly weekChart = computed(() => {
    const s = this.snapshot();
    const locale = this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB';
    const week = this.i18n.t('rp.week');
    return {
      labels: (s?.week ?? []).map((d) => bucketLabel(d.key, 'day', locale, week)),
      datasets: [
        { label: this.i18n.t('rp.kpi.checkIns'), data: (s?.week ?? []).map((d) => d.checkIns), backgroundColor: REPORT_COLORS.checkIns, borderRadius: 4 },
        { label: this.i18n.t('rp.kpi.checkOuts'), data: (s?.week ?? []).map((d) => d.checkOuts), backgroundColor: REPORT_COLORS.checkOuts, borderRadius: 4 },
      ],
    };
  });
  readonly chartOptions = barOptions();

  constructor() {
    this.i18n.register(DASHBOARD_DICTIONARY);
    this.i18n.register(REPORTS_DICTIONARY);
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        if (items.length) {
          this.branchId.set(items[0]._id);
          this.reload();
        }
      },
    });
  }

  onBranchChange(id: string | null): void {
    this.branchId.set(id ?? undefined);
    this.reload();
  }

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.loading.set(true);
    this.failed.set(false);
    this.reportsApi.dashboard(branchId).subscribe({
      next: (s) => {
        this.snapshot.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
    this.reportsApi.arrivals(branchId).subscribe({ next: (rows) => this.arrivals.set(rows) });
    this.reportsApi.departures(branchId).subscribe({ next: (rows) => this.departures.set(rows) });
  }
}
