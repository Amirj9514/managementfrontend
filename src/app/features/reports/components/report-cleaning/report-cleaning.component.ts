import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { UIChart as Chart } from 'primeng/chart';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { CleaningRow } from '../../../../core/models/report.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { reportLoader } from '../../report-loader';
import { REPORT_COLORS, barOptions, bucketLabel, downloadCsv, minutesText } from '../../reports.util';
import { ReportsApiService } from '../../services/reports-api.service';

/** Room cleaning: how many jobs, how fast they were done and verified, who did them, and how often they were redone. */
@Component({
  selector: 'app-report-cleaning',
  imports: [DatePipe, FormsModule, Button, Chart, IconField, InputIcon, InputText, Skeleton, TableModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './report-cleaning.component.html',
  styleUrl: './report-cleaning.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCleaningComponent {
  private readonly api = inject(ReportsApiService);
  readonly i18n = inject(TranslationService);

  readonly branchId = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();

  private readonly load = reportLoader({ branchId: this.branchId, from: this.from, to: this.to }, (b, r) => this.api.cleaning(b, r));
  readonly data = this.load.data;
  readonly loading = this.load.loading;
  readonly failed = this.load.failed;

  readonly search = signal('');
  readonly minutesText = minutesText;

  private locale(): string {
    return this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB';
  }

  readonly rows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const all = this.data()?.rows ?? [];
    if (!q) return all;
    return all.filter((r) => [r.unitCode, r.cleanerName, r.buildingName, r.floorLabel, r.verifiedBy].some((v) => (v ?? '').toLowerCase().includes(q)));
  });

  readonly chartData = computed(() => {
    this.i18n.currentLang();
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };
    return {
      labels: d.series.map((s) => bucketLabel(s.key, d.range.groupBy, this.locale(), this.i18n.t('rp.week'))),
      datasets: [
        { label: this.i18n.t('rp.cl.requested'), data: d.series.map((s) => s.requested), backgroundColor: REPORT_COLORS.requested, borderRadius: 5 },
        { label: this.i18n.t('rp.cl.completed'), data: d.series.map((s) => s.completed), backgroundColor: REPORT_COLORS.cleaned, borderRadius: 5 },
      ],
    };
  });
  readonly chartOptions = barOptions();

  statusTone(s: string): string {
    return s === 'done' ? 'green' : s === 'awaiting_verification' ? 'violet' : s === 'cancelled' ? 'red' : 'amber';
  }

  placeOf(r: CleaningRow): string {
    return [r.buildingName, r.floorLabel].filter(Boolean).join(' · ') || '—';
  }

  export(): void {
    const d = this.data();
    if (!d) return;
    downloadCsv(
      `cleaning-${d.range.from}_${d.range.to}.csv`,
      ['Room', 'Building', 'Floor', 'Source', 'Status', 'Cleaner', 'Requested at', 'Assigned at', 'Started at', 'Cleaned at', 'Verified at', 'Verified by', 'Redo count', 'Cleaning (min)', 'Turnaround (min)'],
      d.rows.map((r) => [r.unitCode, r.buildingName, r.floorLabel, r.source, r.status, r.cleanerName, r.createdAt, r.assignedAt, r.startedAt, r.cleanedAt, r.verifiedAt, r.verifiedBy, r.redoCount, r.cleaningMinutes, r.turnaroundMinutes]),
    );
  }
}
