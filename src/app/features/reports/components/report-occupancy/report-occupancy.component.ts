import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Button } from 'primeng/button';
import { UIChart as Chart } from 'primeng/chart';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { BOOKING_STATUS_SEVERITY } from '../../../../core/models/booking.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { reportLoader } from '../../report-loader';
import { REPORT_COLORS, downloadCsv } from '../../reports.util';
import { ReportsApiService } from '../../services/reports-api.service';

/** Room occupancy over the period (with the average and peak) and who used each hall on which day. */
@Component({
  selector: 'app-report-occupancy',
  imports: [DatePipe, Button, Chart, Skeleton, TableModule, Tag, EmptyStateComponent, StatusBadgeComponent, TranslatePipe],
  templateUrl: './report-occupancy.component.html',
  styleUrl: './report-occupancy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportOccupancyComponent {
  private readonly api = inject(ReportsApiService);
  readonly i18n = inject(TranslationService);
  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly branchId = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();

  private readonly load = reportLoader({ branchId: this.branchId, from: this.from, to: this.to }, (b, r) =>
    forkJoin({ occupancy: this.api.occupancy(b, r), halls: this.api.hallOccupancy(b, r), utilization: this.api.utilization(b, r) }),
  );
  readonly data = this.load.data;
  readonly loading = this.load.loading;
  readonly failed = this.load.failed;

  readonly avgPct = computed(() => {
    const rows = this.data()?.occupancy ?? [];
    return rows.length ? Math.round((rows.reduce((s, r) => s + r.occupancyPct, 0) / rows.length) * 10) / 10 : 0;
  });
  readonly peakPct = computed(() => Math.max(0, ...(this.data()?.occupancy ?? []).map((d) => d.occupancyPct)));

  readonly chartData = computed(() => ({
    labels: (this.data()?.occupancy ?? []).map((d) => d.date),
    datasets: [
      {
        label: this.i18n.t('reports.chartLabel'),
        data: (this.data()?.occupancy ?? []).map((d) => d.occupancyPct),
        borderColor: REPORT_COLORS.occupancy,
        backgroundColor: 'rgba(99,102,241,0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 1,
      },
    ],
  }));
  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100, ticks: { callback: (v: string | number) => `${v}%` }, grid: { color: 'rgba(127,127,127,0.15)' } }, x: { grid: { display: false } } },
  };

  meterTone(pct: number): 'low' | 'mid' | 'high' {
    return pct >= 90 ? 'high' : pct >= 50 ? 'mid' : 'low';
  }

  exportOccupancy(): void {
    const d = this.data();
    if (!d?.occupancy.length) return;
    downloadCsv(
      `occupancy-${this.from()}_${this.to()}.csv`,
      ['Date', 'Total rooms', 'Occupied rooms', 'Occupancy %'],
      d.occupancy.map((r) => [r.date, r.totalRooms, r.occupiedRooms, r.occupancyPct]),
    );
  }

  /** One row per party per day — only days that actually had a booking. */
  exportHalls(): void {
    const halls = this.data()?.halls ?? [];
    if (!halls.length) return;
    downloadCsv(
      `hall-usage-${this.from()}_${this.to()}.csv`,
      ['Hall', 'Date', 'Booking #', 'Guest', 'Party size', 'Capacity', 'Occupied that day', 'Remaining', 'Status'],
      halls.flatMap((h) => h.perDay.flatMap((d) => d.parties.map((p) => [h.code, d.date, p.bookingNumber, p.guestName, p.partySize, h.maxCapacity, d.occupied, d.remaining, p.status]))),
    );
  }
}
