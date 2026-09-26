import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import {
  BOOKING_STATUS_SEVERITY,
  type BookingRow,
  type BookingStatus,
} from '../../../../core/models/booking.model';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';

const STATUS_OPTIONS: { label: string; value: BookingStatus }[] = [
  { label: 'Reserved', value: 'reserved' },
  { label: 'Checked in', value: 'checked_in' },
  { label: 'Checked out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No show', value: 'no_show' },
];

const TYPE_OPTIONS = [
  { label: 'Room', value: 'room' },
  { label: 'Hall', value: 'hall' },
];

@Component({
  selector: 'app-booking-list',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    Toolbar,
    Button,
    Select,
    Paginator,
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingListComponent {
  private readonly api = inject(BookingsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly router = inject(Router);
  private readonly drawer = inject(BookingDetailDrawerService);

  readonly statusOptions = STATUS_OPTIONS;
  readonly typeOptions = TYPE_OPTIONS;
  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly status = signal<BookingStatus | undefined>(undefined);
  readonly bookingType = signal<string | undefined>(undefined);

  readonly rows = signal<BookingRow[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  constructor() {
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        if (items.length) {
          this.branchId.set(items[0]._id);
          this.reload();
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  onBranchChange(id: string | null): void {
    this.branchId.set(id ?? undefined);
    this.page.set(1);
    this.reload();
  }

  onStatusChange(status: BookingStatus | null): void {
    this.status.set(status ?? undefined);
    this.page.set(1);
    this.reload();
  }

  onTypeChange(type: string | null): void {
    this.bookingType.set(type ?? undefined);
    this.page.set(1);
    this.reload();
  }

  onPaginatorChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    this.page.set(Math.floor(first / rows) + 1);
    this.pageSize.set(rows);
    this.reload();
  }

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) {
      this.rows.set([]);
      return;
    }
    this.loading.set(true);
    this.api
      .list({ branchId, status: this.status(), bookingType: this.bookingType() }, this.page(), this.pageSize())
      .subscribe({
        next: ({ items, pagination }) => {
          this.rows.set(items);
          this.totalRecords.set(pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  open(id: string): void {
    this.drawer.open(id);
  }

  goNew(): void {
    void this.router.navigate(['/bookings/new']);
  }
}
