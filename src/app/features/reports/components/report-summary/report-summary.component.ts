import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Button } from 'primeng/button';
import { UIChart as Chart } from 'primeng/chart';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { SummaryTotals } from '../../../../core/models/report.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { reportLoader } from '../../report-loader';
import { REPORT_COLORS, barOptions, bucketLabel, downloadCsv, pctChange } from '../../reports.util';
import { ReportsApiService } from '../../services/reports-api.service';

interface Tile {
  key: keyof SummaryTotals;
  label: string;
  tone: string;
  value: string;
  delta: number | null;
  prev: string;
}

/** The headline numbers for the period, how they compare to the period just before it, and the trend. */
@Component({
  selector: 'app-report-summary',
  imports: [Button, Chart, Skeleton, TableModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './report-summary.component.html',
  styleUrl: './report-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportSummaryComponent {
  private readonly api = inject(ReportsApiService);
  readonly i18n = inject(TranslationService);

  readonly branchId = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();

  private readonly load = reportLoader({ branchId: this.branchId, from: this.from, to: this.to }, (b, r) => this.api.summary(b, r));
  readonly data = this.load.data;
  readonly loading = this.load.loading;
  readonly failed = this.load.failed;

  private locale(): string {
    return this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB';
  }

  readonly tiles = computed<Tile[]>(() => {
    this.i18n.currentLang();
    const d = this.data();
    if (!d) return [];
    const t = d.totals;
    const p = d.previousTotals;
    const mk = (key: keyof SummaryTotals, label: string, tone: string, fmt: (n: number) => string): Tile => ({
      key,
      label: this.i18n.t(label),
      tone,
      value: fmt(t[key]),
      delta: pctChange(t[key], p[key]),
      prev: fmt(p[key]),
    });
    const plain = (n: number) => String(n);
    const pct = (n: number) => `${n}%`;
    return [
      mk('checkIns', 'rp.kpi.checkIns', 'green', plain),
      mk('checkOuts', 'rp.kpi.checkOuts', 'amber', plain),
      mk('cleaned', 'rp.kpi.cleaned', 'blue', plain),
      mk('occupancyPct', 'rp.kpi.occupancy', 'indigo', pct),
      mk('guests', 'rp.kpi.guests', 'teal', plain),
      mk('avgStayNights', 'rp.kpi.avgStay', 'slate', (n) => this.i18n.t('rp.nightsN', { n })),
    ];
  });

  readonly labelOf = (key: string): string => {
    const d = this.data();
    return d ? bucketLabel(key, d.range.groupBy, this.locale(), this.i18n.t('rp.week')) : key;
  };

  readonly chartData = computed(() => {
    this.i18n.currentLang();
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };
    return {
      labels: d.series.map((s) => this.labelOf(s.key)),
      datasets: [
        { type: 'bar', label: this.i18n.t('rp.kpi.checkIns'), data: d.series.map((s) => s.checkIns), backgroundColor: REPORT_COLORS.checkIns, borderRadius: 4 },
        { type: 'bar', label: this.i18n.t('rp.kpi.checkOuts'), data: d.series.map((s) => s.checkOuts), backgroundColor: REPORT_COLORS.checkOuts, borderRadius: 4 },
        { type: 'bar', label: this.i18n.t('rp.kpi.cleaned'), data: d.series.map((s) => s.cleaned), backgroundColor: REPORT_COLORS.cleaned, borderRadius: 4 },
        {
          type: 'line',
          label: this.i18n.t('rp.kpi.occupancy'),
          data: d.series.map((s) => s.occupancyPct),
          borderColor: REPORT_COLORS.occupancy,
          backgroundColor: REPORT_COLORS.occupancy,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: 'y1',
        },
      ],
    };
  });

  readonly chartOptions = (() => {
    const o = barOptions() as { scales: Record<string, unknown> };
    o.scales['y1'] = { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { callback: (v: string | number) => `${v}%` } };
    return o;
  })();

  readonly empty = computed(() => {
    const t = this.data()?.totals;
    return !!t && t.checkIns + t.checkOuts + t.cleaned + t.requested === 0;
  });

  deltaClass(d: number | null): string {
    return d === null || d === 0 ? 'rp-delta--flat' : d > 0 ? 'rp-delta--up' : 'rp-delta--down';
  }

  deltaText(d: number | null): string {
    if (d === null) return this.i18n.t('rp.new');
    return d === 0 ? '0%' : `${d > 0 ? '+' : ''}${d}%`;
  }

  export(): void {
    const d = this.data();
    if (!d) return;
    downloadCsv(
      `summary-${d.range.from}_${d.range.to}.csv`,
      ['Period', 'Check-ins', 'Check-outs', 'Rooms cleaned', 'Occupancy %'],
      d.series.map((s) => [s.key, s.checkIns, s.checkOuts, s.cleaned, s.occupancyPct]),
    );
  }
}
