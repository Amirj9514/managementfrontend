import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { Toolbar } from 'primeng/toolbar';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import { BOOKING_STATUS_SEVERITY } from '../../../../core/models/booking.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { BOOKINGS_DICTIONARY } from '../../../bookings/bookings.dictionary';
import { BookingDetailDrawerService } from '../../../bookings/services/booking-detail-drawer.service';
import { BookingsApiService } from '../../../bookings/services/bookings-api.service';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { CHECKOUT_DICTIONARY } from '../../checkout.dictionary';
import { CheckoutApiService, type CheckoutUnitRow } from '../../services/checkout-api.service';

type BoardTab = 'all' | 'arrivals' | 'checkedOut' | 'cancelled';

const TAB_STATUS: Record<BoardTab, string> = {
  all: 'reserved,checked_in,checked_out,cancelled,no_show',
  arrivals: 'reserved',
  checkedOut: 'checked_out',
  cancelled: 'cancelled,no_show',
};

/**
 * Front-desk board: every booked room/hall that is waiting to be checked in, or is in-house and
 * waiting to be checked out, with one-click actions. Check-in / check-out buttons only appear for
 * users holding `checkout.checkin` / `checkout.checkout`; the server enforces the same.
 */
@Component({
  selector: 'app-checkout-board',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    Card,
    Toolbar,
    Button,
    Select,
    SelectButton,
    InputText,
    Tag,
    Paginator,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    Tooltip,
    TranslatePipe,
  ],
  templateUrl: './checkout-board.component.html',
  styleUrl: './checkout-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutBoardComponent {
  private readonly auth = inject(AuthService);
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly drawer = inject(BookingDetailDrawerService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmService);
  readonly i18n = inject(TranslationService);

  readonly statusSeverityMap = BOOKING_STATUS_SEVERITY;
  /** The buttons are always shown; without access they are disabled with an explanation. */
  readonly canCheckIn = computed(() => this.auth.can('checkout.checkin'));
  readonly canCheckOut = computed(() => this.auth.can('checkout.checkout'));

  readonly tab = signal<BoardTab>('all');
  readonly tabOptions = computed(() => [
    { label: this.i18n.t('checkout.tab.all'), value: 'all' as BoardTab },
    { label: this.i18n.t('checkout.tab.arrivals'), value: 'arrivals' as BoardTab },
    { label: this.i18n.t('checkout.tab.checkedOut'), value: 'checkedOut' as BoardTab },
    { label: this.i18n.t('checkout.tab.cancelled'), value: 'cancelled' as BoardTab },
  ]);

  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly search = signal('');

  readonly rows = signal<CheckoutUnitRow[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());
  /** Line currently being checked in/out — keeps its buttons disabled so it can't be sent twice. */
  readonly busyId = signal<string | null>(null);

  readonly pageReportTemplate = computed(() => `{first}–{last} ${this.i18n.t('common.of')} {totalRecords}`);

  constructor() {
    this.i18n.register(BOOKINGS_DICTIONARY);
    this.i18n.register(CHECKOUT_DICTIONARY);
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

  onTabChange(tab: BoardTab | null): void {
    // SelectButton emits null when the active option is clicked again — keep the current tab.
    if (!tab) return;
    this.tab.set(tab);
    this.page.set(1);
    this.reload();
  }

  onBranchChange(id: string | null): void {
    this.branchId.set(id ?? undefined);
    this.page.set(1);
    this.reload();
  }

  applySearch(): void {
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
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.checkoutApi
      .list(
        {
          branchId,
          status: TAB_STATUS[this.tab()],
          bookingNumber: this.search().trim() || undefined,
        },
        this.page(),
        this.pageSize(),
      )
      .subscribe({
        next: ({ items, pagination }) => {
          this.rows.set(items);
          this.totalRecords.set(pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  unitLabel(row: CheckoutUnitRow): string {
    return row.unitCode ?? '—';
  }

  isOverdue(row: CheckoutUnitRow): boolean {
    return row.status === 'checked_in' && new Date(row.expectedCheckOut).getTime() < Date.now();
  }

  openDetails(row: CheckoutUnitRow): void {
    this.drawer.open(row.bookingId);
  }

  checkIn(row: CheckoutUnitRow): void {
    this.busyId.set(row._id);
    this.bookingsApi.checkIn(row.bookingId, row._id).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('status.checkedIn'),
          detail: this.i18n.t('checkout.checkedInToast', { unit: this.unitLabel(row) }),
        });
        this.busyId.set(null);
        this.reload();
      },
      error: () => this.busyId.set(null),
    });
  }

  confirmCheckOut(row: CheckoutUnitRow): void {
    this.confirmation.confirm({
      header: this.i18n.t('checkout.confirmOutHeader'),
      message: this.i18n.t('checkout.confirmOutMessage', {
        guest: row.primaryGuestName ?? this.i18n.t('bookings.unknownGuest'),
        unit: this.unitLabel(row),
      }),
      icon: 'pi pi-sign-out',
      accept: () => this.checkOut(row),
    });
  }

  private checkOut(row: CheckoutUnitRow): void {
    this.busyId.set(row._id);
    this.bookingsApi.checkOut(row.bookingId, row._id).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('status.checkedOut'),
          detail: this.i18n.t('checkout.checkedOutToast', { unit: this.unitLabel(row) }),
        });
        this.busyId.set(null);
        this.reload();
      },
      error: () => this.busyId.set(null),
    });
  }
}
