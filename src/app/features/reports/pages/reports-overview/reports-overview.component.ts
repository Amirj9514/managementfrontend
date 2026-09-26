import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { UIChart as Chart } from 'primeng/chart';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import type { BookingUnitRow } from '../../../../core/models/booking.model';
import type {
  HallOccupancyReportRow,
  OccupancyDayRow,
  RoomUtilizationReportResponse,
} from '../../../../core/models/report.model';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/stat-card/stat-card.component';
import { ReportsApiService } from '../../services/reports-api.service';

type ReportView = 'occupancy' | 'arrivals' | 'departures';

const VIEW_OPTIONS: { label: string; value: ReportView }[] = [
  { label: 'Occupancy', value: 'occupancy' },
  { label: 'Arrivals', value: 'arrivals' },
  { label: 'Departures', value: 'departures' },
];

@Component({
  selector: 'app-reports-overview',
  imports: [
    DatePipe,
    FormsModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    StatCardComponent,
    Button,
    Select,
    SelectButton,
    DatePicker,
    Chart,
    TableModule,
  ],
  templateUrl: './reports-overview.component.html',
  styleUrl: './reports-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsOverviewComponent {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly branchesApi = inject(BranchesApiService);

  readonly viewOptions = VIEW_OPTIONS;
  readonly view = signal<ReportView>('occupancy');

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly from = signal<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  readonly to = signal<Date>(new Date());

  readonly loading = signal(false);
  readonly occupancy = signal<OccupancyDayRow[]>([]);
  readonly hallOccupancy = signal<HallOccupancyReportRow[]>([]);
  readonly utilization = signal<RoomUtilizationReportResponse | null>(null);
  readonly arrivals = signal<BookingUnitRow[]>([]);
  readonly departures = signal<BookingUnitRow[]>([]);

  readonly occupancyChartData = computed(() => ({
    labels: this.occupancy().map((d) => d.date),
    datasets: [
      {
        label: 'Occupancy %',
        data: this.occupancy().map((d) => d.occupancyPct),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        tension: 0.35,
        fill: true,
      },
    ],
  }));

  readonly chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } };

  readonly avgOccupancyPct = computed(() => {
    const rows = this.occupancy();
    if (!rows.length) return 0;
    return Math.round((rows.reduce((s, r) => s + r.occupancyPct, 0) / rows.length) * 10) / 10;
  });

  constructor() {
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

  onViewChange(view: ReportView): void {
    this.view.set(view);
    this.reload();
  }

  onDateChange(): void {
    this.reload();
  }

  private range() {
    return { from: this.from().toISOString(), to: this.to().toISOString() };
  }

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.loading.set(true);
    const range = this.range();

    switch (this.view()) {
      case 'occupancy':
        this.reportsApi.occupancy(branchId, range).subscribe({ next: (r) => this.finish(() => this.occupancy.set(r)) });
        this.reportsApi.hallOccupancy(branchId, range).subscribe({ next: (r) => this.hallOccupancy.set(r) });
        this.reportsApi.utilization(branchId, range).subscribe({ next: (r) => this.utilization.set(r) });
        break;
      case 'arrivals':
        this.reportsApi.arrivals(branchId).subscribe({ next: (r) => this.finish(() => this.arrivals.set(r)) });
        break;
      case 'departures':
        this.reportsApi.departures(branchId).subscribe({ next: (r) => this.finish(() => this.departures.set(r)) });
        break;
    }
  }

  private finish(apply: () => void): void {
    apply();
    this.loading.set(false);
  }

  exportCsv(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CSV export is generic over whichever report view is active
    let rows: any[] = [];
    switch (this.view()) {
      case 'occupancy':
        rows = this.occupancy();
        break;
      case 'arrivals':
        rows = this.arrivals();
        break;
      case 'departures':
        rows = this.departures();
        break;
    }
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.view()}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
