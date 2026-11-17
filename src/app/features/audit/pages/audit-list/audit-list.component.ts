import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { AuditFacets, AuditFilter, AuditKind, AuditPeriod, AuditRow } from '../../../../core/models/audit.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { TableSkeletonComponent } from '../../../../shared/table-skeleton/table-skeleton.component';
import { AUDIT_DICTIONARY } from '../../audit.dictionary';
import { AuditDetailComponent } from '../../components/audit-detail/audit-detail.component';
import { AuditApiService } from '../../services/audit-api.service';
import { AuditPresenter } from '../../services/audit-presenter.service';

/**
 * Audit log: who did what, in plain language. Filter by period, kind, area, person or free text; click any
 * line for the full story (what it means, who, when, what it touched, what was submitted, technical details).
 */
@Component({
  selector: 'app-audit-list',
  imports: [
    FormsModule,
    Button,
    IconField,
    InputIcon,
    InputText,
    Paginator,
    Select,
    SelectButton,
    TableModule,
    EmptyStateComponent,
    PageHeaderComponent,
    TableSkeletonComponent,
    AuditDetailComponent,
    TranslatePipe,
  ],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent {
  private readonly api = inject(AuditApiService);
  private readonly i18n = inject(TranslationService);
  readonly p = inject(AuditPresenter);

  readonly rows = signal<AuditRow[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());
  readonly facets = signal<AuditFacets | null>(null);

  // --- filters
  readonly search = signal('');
  readonly module = signal<string | null>(null);
  readonly actorId = signal<string | null>(null);
  readonly kind = signal<AuditKind>('all');
  readonly period = signal<AuditPeriod>('7d');
  private readonly search$ = new Subject<string>();

  readonly kindOptions = computed(() => {
    this.i18n.currentLang();
    return (['all', 'create', 'update', 'delete', 'restore'] as AuditKind[]).map((v) => ({ value: v, label: this.i18n.t('audit.kind.' + v) }));
  });
  readonly periodOptions = computed(() => {
    this.i18n.currentLang();
    return (['today', '7d', '30d', 'all'] as AuditPeriod[]).map((v) => ({ value: v, label: this.i18n.t('audit.period.' + v) }));
  });
  readonly moduleOptions = computed(() => [
    { value: null as string | null, label: this.i18n.t('audit.allAreas') },
    ...(this.facets()?.modules ?? []).map((m) => ({ value: m.key as string | null, label: `${this.p.moduleLabel(m.key)} (${m.count})` })),
  ]);
  readonly actorOptions = computed(() => [
    { value: null as string | null, label: this.i18n.t('audit.anyone') },
    ...(this.facets()?.actors ?? []).map((a) => ({ value: a._id as string | null, label: a.name })),
  ]);
  readonly hasFilters = computed(
    () => !!this.search().trim() || !!this.module() || !!this.actorId() || this.kind() !== 'all' || this.period() !== '7d',
  );

  // --- details drawer
  readonly selectedIndex = signal<number | null>(null);
  readonly selected = computed(() => (this.selectedIndex() === null ? null : (this.rows()[this.selectedIndex()!] ?? null)));

  constructor() {
    this.i18n.register(AUDIT_DICTIONARY);
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => this.applyFilters());
    this.api.facets().subscribe({ next: (f) => this.facets.set(f) });
    this.reload();
  }

  private filter(): AuditFilter {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from =
      this.period() === 'today'
        ? startOfToday
        : this.period() === '7d'
          ? new Date(now.getTime() - 7 * 86400000)
          : this.period() === '30d'
            ? new Date(now.getTime() - 30 * 86400000)
            : null;
    return {
      search: this.search().trim() || undefined,
      module: this.module(),
      actorId: this.actorId(),
      kind: this.kind(),
      from: from?.toISOString(),
    };
  }

  reload(): void {
    this.loading.set(true);
    this.api.list(this.filter(), this.page(), this.pageSize()).subscribe({
      next: ({ items, pagination }) => {
        this.rows.set(items);
        this.total.set(pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.selectedIndex.set(null);
    this.reload();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.search$.next(value.trim());
  }

  setModule(v: string | null): void {
    this.module.set(v ?? null);
    this.applyFilters();
  }

  setActor(v: string | null): void {
    this.actorId.set(v ?? null);
    this.applyFilters();
  }

  setKind(v: AuditKind | null): void {
    this.kind.set(v ?? 'all');
    this.applyFilters();
  }

  setPeriod(v: AuditPeriod | null): void {
    this.period.set(v ?? 'all');
    this.applyFilters();
  }

  clearFilters(): void {
    this.search.set('');
    this.module.set(null);
    this.actorId.set(null);
    this.kind.set('all');
    this.period.set('7d');
    this.applyFilters();
  }

  onPage(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    this.page.set(Math.floor((event.first ?? 0) / rows) + 1);
    this.pageSize.set(rows);
    this.selectedIndex.set(null);
    this.reload();
  }

  initials(name: string | undefined): string {
    const parts = (name ?? '').split(/[\s@.]+/).filter(Boolean);
    return name ? ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase() : '';
  }

  open(index: number): void {
    this.selectedIndex.set(index);
  }

  closeDetail(): void {
    this.selectedIndex.set(null);
  }

  /** Newer = the row above (the list is newest first). */
  newer(): void {
    this.selectedIndex.update((i) => (i !== null && i > 0 ? i - 1 : i));
  }

  older(): void {
    this.selectedIndex.update((i) => (i !== null && i < this.rows().length - 1 ? i + 1 : i));
  }
}
