import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { UIChart as Chart } from 'primeng/chart';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import { BOOKING_STATUS_SEVERITY } from '../../../../core/models/booking.model';
import type {
  HallOccupancyReportRow,
  OccupancyDayRow,
  ReportLineRow,
  RoomUtilizationReportResponse,
} from '../../../../core/models/report.model';
import { addDaysFromToday, toDateKey } from '../../../../core/utils/date-key';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { ReportsApiService } from '../../services/reports-api.service';
import { REPORTS_DICTIONARY } from '../../reports.dictionary';

type ReportView = 'occupancy' | 'arrivals' | 'departures';

const VIEW_OPTION_KEYS: { key: string; value: ReportView }[] = [
  { key: 'reports.view.occupancy', value: 'occupancy' },
  { key: 'reports.view.arrivals', value: 'arrivals' },
  { key: 'reports.view.departures', value: 'departures' },
];

/** Escapes one CSV cell (quotes, commas, newlines) and neutralises spreadsheet formulas. */
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  // BOM so Excel opens UTF-8 (Urdu names) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

@Component({
  selector: 'app-reports-overview',
  imports: [
    DatePipe,
    FormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatCardComponent,
    Button,
    Select,
    SelectButton,
    DatePicker,
    Chart,
    Skeleton,
    TableModule,
    Tag,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './reports-overview.component.html',
  styleUrl: './reports-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsOverviewComponent {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  readonly i18n = inject(TranslationService);

  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly viewOptions = computed(() => {
    this.i18n.currentLang();
    return VIEW_OPTION_KEYS.map((o) => ({ label: this.i18n.t(o.key), value: o.value }));
  });
  readonly view = signal<ReportView>('occupancy');

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  /** Occupancy range (inclusive, whole days). */
  readonly from = signal<Date>(addDaysFromToday(-29));
  readonly to = signal<Date>(addDaysFromToday(0));
  /** The single day shown by Arrivals / Departures. */
  readonly day = signal<Date>(addDaysFromToday(0));

  readonly loading = signal(false);
  readonly occupancy = signal<OccupancyDayRow[]>([]);
  readonly hallOccupancy = signal<HallOccupancyReportRow[]>([]);
  readonly utilization = signal<RoomUtilizationReportResponse | null>(null);
  readonly arrivals = signal<ReportLineRow[]>([]);
  readonly departures = signal<ReportLineRow[]>([]);
  readonly skeletons = [1, 2, 3];

  readonly maxDate = addDaysFromToday(0);

  readonly occupancyChartData = computed(() => ({
    labels: this.occupancy().map((d) => d.date),
    datasets: [
      {
        label: this.i18n.t('reports.chartLabel'),
        data: this.occupancy().map((d) => d.occupancyPct),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        tension: 0.35,
        fill: true,
      },
    ],
  }));

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100, ticks: { callback: (v: string | number) => `${v}%` } } },
  };

  readonly avgOccupancyPct = computed(() => {
    const rows = this.occupancy();
    if (!rows.length) return 0;
    return Math.round((rows.reduce((s, r) => s + r.occupancyPct, 0) / rows.length) * 10) / 10;
  });
  readonly peakOccupancy = computed(() => Math.max(0, ...this.occupancy().map((d) => d.occupancyPct)));
  readonly totalHallDays = computed(() => this.hallOccupancy().reduce((s, h) => s + h.daysWithStays, 0));
  readonly activeLines = computed(() => (this.view() === 'arrivals' ? this.arrivals() : this.departures()));

  constructor() {
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

  onViewChange(view: ReportView | null): void {
    if (!view) return;
    this.view.set(view);
    this.reload();
  }

  setFrom(date: Date | null): void {
    if (!date) return;
    this.from.set(date);
    // Keep the range valid: the end can never be before the start.
    if (this.to() < date) this.to.set(date);
    this.reload();
  }

  setTo(date: Date | null): void {
    if (!date) return;
    this.to.set(date);
    if (this.from() > date) this.from.set(date);
    this.reload();
  }

  setDay(date: Date | null): void {
    if (!date) return;
    this.day.set(date);
    this.reload();
  }

  /** Quick ranges for the occupancy view. */
  setLastDays(days: number): void {
    this.to.set(addDaysFromToday(0));
    this.from.set(addDaysFromToday(-(days - 1)));
    this.reload();
  }

  shiftDay(offset: number): void {
    const d = new Date(this.day());
    d.setDate(d.getDate() + offset);
    this.setDay(d);
  }

  private rangeParams() {
    return { from: toDateKey(this.from()), to: toDateKey(this.to()) };
  }

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.loading.set(true);

    switch (this.view()) {
      case 'occupancy': {
        const range = this.rangeParams();
        let pending = 3;
        const done = () => {
          pending -= 1;
          if (pending === 0) this.loading.set(false);
        };
        this.reportsApi.occupancy(branchId, range).subscribe({ next: (r) => this.occupancy.set(r), error: done, complete: done });
        this.reportsApi.hallOccupancy(branchId, range).subscribe({ next: (r) => this.hallOccupancy.set(r), error: done, complete: done });
        this.reportsApi.utilization(branchId, range).subscribe({ next: (r) => this.utilization.set(r), error: done, complete: done });
        break;
      }
      case 'arrivals':
        this.reportsApi.arrivals(branchId, toDateKey(this.day())).subscribe({
          next: (r) => this.arrivals.set(r),
          error: () => this.loading.set(false),
          complete: () => this.loading.set(false),
        });
        break;
      case 'departures':
        this.reportsApi.departures(branchId, toDateKey(this.day())).subscribe({
          next: (r) => this.departures.set(r),
          error: () => this.loading.set(false),
          complete: () => this.loading.set(false),
        });
        break;
    }
  }

  // ---- helpers for the template

  hallPartyNames(day: HallOccupancyReportRow['perDay'][number]): string {
    return day.parties.map((p) => p.guestName ?? '—').join(', ');
  }

  meterTone(pct: number): 'low' | 'mid' | 'high' {
    return pct >= 90 ? 'high' : pct >= 50 ? 'mid' : 'low';
  }

  // ---- CSV

  /** Exports what the current tab shows. */
  exportCsv(): void {
    const stamp = `${toDateKey(this.from())}_${toDateKey(this.to())}`;
    switch (this.view()) {
      case 'occupancy':
        if (!this.occupancy().length) return;
        downloadCsv(
          `occupancy-${stamp}.csv`,
          ['Date', 'Total rooms', 'Occupied rooms', 'Occupancy %'],
          this.occupancy().map((r) => [r.date, r.totalRooms, r.occupiedRooms, r.occupancyPct]),
        );
        break;
      case 'arrivals':
      case 'departures':
        this.exportLines();
        break;
    }
  }

  private exportLines(): void {
    const arrivals = this.view() === 'arrivals';
    const lines = this.activeLines();
    if (!lines.length) return;
    downloadCsv(
      `${this.view()}-${toDateKey(this.day())}.csv`,
      ['Booking #', 'Guest', 'Phone', 'Unit', 'Type', arrivals ? 'Check-in' : 'Check-out', 'Status'],
      lines.map((l) => [
        l.bookingNumber,
        l.primaryGuestName,
        l.primaryGuestPhone,
        l.unitCode,
        l.unitType === 'public_hall' ? 'Hall' : 'Room',
        arrivals ? l.checkInDate : l.expectedCheckOut,
        l.status,
      ]),
    );
  }

  /** One row per party per day — only days that actually had a booking. */
  exportHallsCsv(): void {
    const halls = this.hallOccupancy();
    if (!halls.length) return;
    const rows = halls.flatMap((h) =>
      h.perDay.flatMap((d) =>
        d.parties.map((p) => [h.code, d.date, p.bookingNumber, p.guestName, p.partySize, h.maxCapacity, d.occupied, d.remaining, p.status]),
      ),
    );
    downloadCsv(
      `hall-usage-${toDateKey(this.from())}_${toDateKey(this.to())}.csv`,
      ['Hall', 'Date', 'Booking #', 'Guest', 'Party size', 'Capacity', 'Occupied that day', 'Remaining', 'Status'],
      rows,
    );
  }
}
