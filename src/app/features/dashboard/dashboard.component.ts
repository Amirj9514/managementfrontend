import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { UIChart as Chart } from 'primeng/chart';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import type { BranchListRow } from '../../core/models/branch-admin.model';
import type { BookingUnitRow } from '../../core/models/booking.model';
import { AuthService } from '../../core/services/auth.service';
import { BranchesApiService } from '../branches/services/branches-api.service';
import { HallsApiService } from '../halls/services/halls-api.service';
import { ReportsApiService } from '../reports/services/reports-api.service';
import { RoomsApiService } from '../rooms/services/rooms-api.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, DatePipe, FormsModule, Card, Select, Chart, TableModule, PageHeaderComponent, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly branchesApi = inject(BranchesApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly hallsApi = inject(HallsApiService);
  private readonly reportsApi = inject(ReportsApiService);
  private readonly router = inject(Router);

  readonly user$ = inject(AuthService).user$;

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);

  readonly occupancyPct = signal(0);
  readonly availableRooms = signal(0);
  readonly hallCapacity = signal({ occupied: 0, total: 0 });
  readonly arrivals = signal<BookingUnitRow[]>([]);
  readonly departures = signal<BookingUnitRow[]>([]);
  readonly occupancyTrend = signal<{ date: string; occupancyPct: number }[]>([]);

  readonly hallRemaining = computed(() => Math.max(this.hallCapacity().total - this.hallCapacity().occupied, 0));

  readonly occupancyChartData = computed(() => ({
    labels: this.occupancyTrend().map((d) => d.date),
    datasets: [
      {
        label: 'Occupancy %',
        data: this.occupancyTrend().map((d) => d.occupancyPct),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        tension: 0.35,
        fill: true,
      },
    ],
  }));

  readonly chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

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

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) return;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    this.reportsApi.occupancy(branchId, { from: todayStart.toISOString(), to: todayEnd.toISOString() }).subscribe({
      next: (rows) => this.occupancyPct.set(rows[0]?.occupancyPct ?? 0),
    });

    this.reportsApi.occupancy(branchId, { from: thirtyDaysAgo.toISOString(), to: now.toISOString() }).subscribe({
      next: (rows) => this.occupancyTrend.set(rows),
    });

    this.roomsApi.list({ branchId, status: 'available' }).subscribe({
      next: ({ pagination }) => this.availableRooms.set(pagination.total),
    });

    this.hallsApi.list({ branchId }).subscribe({
      next: ({ items }) => {
        const total = items.reduce((s, h) => s + h.maxCapacity, 0);
        const occupied = items.reduce((s, h) => s + (h.occupancy?.occupied ?? 0), 0);
        this.hallCapacity.set({ occupied, total });
      },
    });

    this.reportsApi.arrivals(branchId).subscribe({ next: (rows) => this.arrivals.set(rows) });
    this.reportsApi.departures(branchId).subscribe({ next: (rows) => this.departures.set(rows) });
  }

  goNewBooking(): void {
    void this.router.navigate(['/bookings/new']);
  }
}
