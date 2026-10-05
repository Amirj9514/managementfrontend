import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
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
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { BookingDetailDrawerService } from '../../services/booking-detail-drawer.service';
import { BookingsApiService } from '../../services/bookings-api.service';
import { BOOKINGS_DICTIONARY } from '../../bookings.dictionary';

const STATUS_KEYS: { key: string; value: BookingStatus }[] = [
  { key: 'status.reserved', value: 'reserved' },
  { key: 'status.checkedIn', value: 'checked_in' },
  { key: 'status.checkedOut', value: 'checked_out' },
  { key: 'status.cancelled', value: 'cancelled' },
  { key: 'status.noShow', value: 'no_show' },
];

const TYPE_KEYS = [
  { key: 'common.room', value: 'room' },
  { key: 'common.hall', value: 'hall' },
];

type ListView = 'cards' | 'table';

/** Per-browser preference only — cards stay the default for anyone who hasn't switched. */
const VIEW_STORAGE_KEY = 'checkins.listView';

function readStoredView(): ListView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

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
    SelectButton,
    Skeleton,
    Tooltip,
    Paginator,
    TranslatePipe,
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
  readonly i18n = inject(TranslationService);

  readonly statusOptions = computed(() => STATUS_KEYS.map((o) => ({ label: this.i18n.t(o.key), value: o.value })));
  readonly typeOptions = computed(() => TYPE_KEYS.map((o) => ({ label: this.i18n.t(o.key), value: o.value })));
  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;

  readonly view = signal<ListView>(readStoredView());
  readonly viewOptions = computed(() => [
    { label: this.i18n.t('bookings.view.cards'), value: 'cards' as ListView, icon: 'pi pi-th-large' },
    { label: this.i18n.t('bookings.view.table'), value: 'table' as ListView, icon: 'pi pi-list' },
  ]);
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly status = signal<BookingStatus | undefined>(undefined);
  readonly bookingType = signal<string | undefined>(undefined);

  readonly rows = signal<BookingRow[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  constructor() {
    this.i18n.register(BOOKINGS_DICTIONARY);
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

  onViewChange(view: ListView | null): void {
    // SelectButton emits null when the active option is clicked again — keep the current view.
    if (!view) return;
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* storage unavailable — the choice just won't persist */
    }
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

  sourceLabel(source: string): string {
    return this.i18n.t(source === 'walk_in' ? 'bookings.source.walkIn' : 'bookings.source.reservation');
  }

  typeLabel(type: string): string {
    return this.i18n.t(type === 'hall' ? 'common.hall' : 'common.room');
  }

  nights(row: BookingRow): number | null {
    if (!row.checkInDate || !row.expectedCheckOut) return null;
    const ms = new Date(row.expectedCheckOut).getTime() - new Date(row.checkInDate).getTime();
    return Math.max(1, Math.round(ms / DAY_MS));
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase();
  }

  readonly pageReportTemplate = computed(() => `{first}–{last} ${this.i18n.t('common.of')} {totalRecords}`);
}
