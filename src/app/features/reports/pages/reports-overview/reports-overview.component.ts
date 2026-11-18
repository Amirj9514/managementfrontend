import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Select } from 'primeng/select';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { BranchListRow } from '../../../../core/models/branch-admin.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { DASHBOARD_DICTIONARY } from '../../../dashboard/dashboard.dictionary';
import { HOUSEKEEPING_DICTIONARY } from '../../../housekeeping/housekeeping.dictionary';
import { ReportCleaningComponent } from '../../components/report-cleaning/report-cleaning.component';
import { ReportGuestsComponent } from '../../components/report-guests/report-guests.component';
import { ReportMovementsComponent } from '../../components/report-movements/report-movements.component';
import { ReportOccupancyComponent } from '../../components/report-occupancy/report-occupancy.component';
import { ReportRangeComponent } from '../../components/report-range/report-range.component';
import { ReportSummaryComponent } from '../../components/report-summary/report-summary.component';
import { REPORTS_DICTIONARY } from '../../reports.dictionary';
import { REPORT_PRESETS, presetRange, toDateKey, type ReportPreset } from '../../reports.util';

type ReportTab = 'summary' | 'checkins' | 'checkouts' | 'cleaning' | 'guests' | 'occupancy';

const TABS: { key: ReportTab; icon: string }[] = [
  { key: 'summary', icon: 'pi pi-chart-bar' },
  { key: 'checkins', icon: 'pi pi-sign-in' },
  { key: 'checkouts', icon: 'pi pi-sign-out' },
  { key: 'cleaning', icon: 'pi pi-sparkles' },
  { key: 'guests', icon: 'pi pi-users' },
  { key: 'occupancy', icon: 'pi pi-building' },
];
const TAB_KEY = 'reports.tab';

/**
 * Reports: pick a branch and a period (today, 7 days, month, year or any start/end date), then switch between
 * the summary, check-ins, check-outs, cleaning, guests and occupancy. Every tab reads the same period, groups the
 * trend by day / week / month to suit its length, and exports what it shows to CSV.
 */
@Component({
  selector: 'app-reports-overview',
  imports: [
    FormsModule,
    Select,
    EmptyStateComponent,
    PageHeaderComponent,
    ReportRangeComponent,
    ReportSummaryComponent,
    ReportMovementsComponent,
    ReportCleaningComponent,
    ReportGuestsComponent,
    ReportOccupancyComponent,
    TranslatePipe,
  ],
  templateUrl: './reports-overview.component.html',
  styleUrl: './reports-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsOverviewComponent {
  private readonly branchesApi = inject(BranchesApiService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);

  readonly tabs = TABS;
  readonly branches = signal<BranchListRow[]>([]);
  readonly branchId = signal<string | undefined>(undefined);
  readonly view = signal<ReportTab>(this.initialTab());
  readonly preset = signal<ReportPreset>(this.initialPreset());
  readonly from = signal<Date>(presetRange(this.initialPreset() === 'custom' ? '7d' : (this.initialPreset() as Exclude<ReportPreset, 'custom'>)).from);
  readonly to = signal<Date>(presetRange(this.initialPreset() === 'custom' ? '7d' : (this.initialPreset() as Exclude<ReportPreset, 'custom'>)).to);

  readonly fromKey = computed(() => toDateKey(this.from()));
  readonly toKey = computed(() => toDateKey(this.to()));
  readonly loaded = signal(false);

  constructor() {
    this.i18n.register(REPORTS_DICTIONARY);
    // the cleaning tab reuses the housekeeping wording, the others a few dashboard words
    this.i18n.register(HOUSEKEEPING_DICTIONARY);
    this.i18n.register(DASHBOARD_DICTIONARY);
    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branches.set(items);
        this.branchId.set(items[0]?._id);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  private initialTab(): ReportTab {
    const q = this.route.snapshot.queryParamMap.get('tab');
    if (q && TABS.some((t) => t.key === q)) return q as ReportTab;
    try {
      const s = localStorage.getItem(TAB_KEY);
      if (s && TABS.some((t) => t.key === s)) return s as ReportTab;
    } catch {
      /* private mode */
    }
    return 'summary';
  }

  private initialPreset(): ReportPreset {
    const q = this.route.snapshot.queryParamMap.get('preset');
    return q && (REPORT_PRESETS as readonly string[]).includes(q) ? (q as ReportPreset) : '7d';
  }

  setView(v: ReportTab): void {
    this.view.set(v);
    try {
      localStorage.setItem(TAB_KEY, v);
    } catch {
      /* private mode */
    }
  }
}
