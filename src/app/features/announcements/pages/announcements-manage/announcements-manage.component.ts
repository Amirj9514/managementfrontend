import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type {
  AnnouncementStatus,
  AnnouncementSummary,
  ManagedAnnouncement,
} from '../../../../core/models/announcement.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { ANNOUNCEMENTS_DICTIONARY } from '../../announcements.dictionary';
import { AnnouncementsApiService } from '../../services/announcements-api.service';

type StatusFilter = '' | AnnouncementStatus;

const MAX_ROLE_CHIPS = 3;

/** Admin table of every announcement: filter cards, search, audience, schedule and read progress. */
@Component({
  selector: 'app-announcements-manage',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    Button,
    InputText,
    IconField,
    InputIcon,
    Menu,
    Paginator,
    Skeleton,
    Tooltip,
    PageHeaderComponent,
    EmptyStateComponent,
    TranslatePipe,
  ],
  templateUrl: './announcements-manage.component.html',
  styleUrl: './announcements-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsManageComponent {
  private readonly api = inject(AnnouncementsApiService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly messages = inject(MessageService);
  readonly i18n = inject(TranslationService);

  readonly status = signal<StatusFilter>('');
  readonly search = signal('');
  readonly summary = signal<AnnouncementSummary | null>(null);
  readonly rows = signal<ManagedAnnouncement[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());
  readonly menuItems = signal<MenuItem[]>([]);
  readonly skeletonRows = [1, 2, 3, 4, 5];
  readonly pageReportTemplate = computed(() => `{first}–{last} ${this.i18n.t('common.of')} {totalRecords}`);

  /** The summary cards double as the status filter. */
  readonly cards = computed(() => {
    const s = this.summary();
    return [
      { key: '' as StatusFilter, icon: 'pi pi-megaphone', tone: 'all', value: s?.total },
      { key: 'active' as StatusFilter, icon: 'pi pi-check-circle', tone: 'active', value: s?.active },
      { key: 'scheduled' as StatusFilter, icon: 'pi pi-clock', tone: 'scheduled', value: s?.scheduled },
      { key: 'expired' as StatusFilter, icon: 'pi pi-history', tone: 'expired', value: s?.expired },
    ];
  });

  private readonly search$ = new Subject<string>();

  constructor() {
    this.i18n.register(ANNOUNCEMENTS_DICTIONARY);
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.reload();
    });
    this.loadSummary();
    this.reload();
  }

  private loadSummary(): void {
    this.api.summary().subscribe({ next: (s) => this.summary.set(s) });
  }

  reload(): void {
    this.loading.set(true);
    this.api.list(this.status() || undefined, this.page(), this.pageSize(), this.search().trim() || undefined).subscribe({
      next: ({ items, pagination }) => {
        this.rows.set(items);
        this.totalRecords.set(pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(key: StatusFilter): void {
    if (this.status() === key) return;
    this.status.set(key);
    this.page.set(1);
    this.reload();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.search$.next(value.trim());
  }

  clearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.page.set(1);
    this.reload();
  }

  onPage(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    this.page.set(Math.floor((event.first ?? 0) / rows) + 1);
    this.pageSize.set(rows);
    this.reload();
  }

  // ---- row helpers

  excerpt(row: ManagedAnnouncement): string {
    const flat = row.body.replace(/\s+/g, ' ').trim();
    return flat.length > 110 ? `${flat.slice(0, 110).trimEnd()}…` : flat;
  }

  visibleRoles(row: ManagedAnnouncement): string[] {
    return row.roles.slice(0, MAX_ROLE_CHIPS);
  }

  hiddenRoleCount(row: ManagedAnnouncement): number {
    return Math.max(0, row.roles.length - MAX_ROLE_CHIPS);
  }

  hiddenRolesLabel(row: ManagedAnnouncement): string {
    return row.roles.slice(MAX_ROLE_CHIPS).map((r) => this.i18n.t('role.' + r)).join(', ');
  }

  pct(row: ManagedAnnouncement): number {
    return row.targetCount ? Math.round((row.viewedCount / row.targetCount) * 100) : 0;
  }

  /** Colour of the read meter: low = amber, partial = blue, everyone = green. */
  meterTone(row: ManagedAnnouncement): 'low' | 'mid' | 'done' {
    const p = this.pct(row);
    return p >= 100 ? 'done' : p >= 50 ? 'mid' : 'low';
  }

  // ---- actions

  goNew(): void {
    void this.router.navigate(['/announcements/new']);
  }

  edit(row: ManagedAnnouncement): void {
    void this.router.navigate(['/announcements', row._id, 'edit']);
  }

  report(row: ManagedAnnouncement): void {
    void this.router.navigate(['/announcements', row._id, 'report']);
  }

  openMenu(event: Event, row: ManagedAnnouncement, menu: Menu): void {
    this.menuItems.set([
      { label: this.i18n.t('announcements.report'), icon: 'pi pi-chart-bar', command: () => this.report(row) },
      { label: this.i18n.t('announcements.edit'), icon: 'pi pi-pencil', command: () => this.edit(row) },
      { separator: true },
      {
        label: this.i18n.t('announcements.delete'),
        icon: 'pi pi-trash',
        styleClass: 'menu-danger',
        command: () => this.remove(row),
      },
    ]);
    menu.toggle(event);
  }

  remove(row: ManagedAnnouncement): void {
    this.confirm.confirm({
      header: this.i18n.t('announcements.confirmDeleteHeader'),
      message: this.i18n.t('announcements.confirmDeleteMessage', { title: row.title }),
      variant: 'danger',
      accept: () =>
        this.api.delete(row._id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('announcements.toast.deleted') });
            this.loadSummary();
            // Deleting the last row of a page would leave it empty — step back one page.
            if (this.rows().length === 1 && this.page() > 1) this.page.update((p) => p - 1);
            this.reload();
          },
        }),
    });
  }
}
