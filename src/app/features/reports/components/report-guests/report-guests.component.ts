import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { UIChart as Chart } from 'primeng/chart';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { reportLoader } from '../../report-loader';
import { REPORT_COLORS, barOptions, bucketLabel, downloadCsv } from '../../reports.util';
import { ReportsApiService } from '../../services/reports-api.service';

type GuestFilter = 'all' | 'returning' | 'new';

/** Who stayed in the period: new vs returning guests, where they come from, and every guest with their stays. */
@Component({
  selector: 'app-report-guests',
  imports: [DatePipe, FormsModule, RouterLink, Button, Chart, IconField, InputIcon, InputText, Skeleton, TableModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './report-guests.component.html',
  styleUrl: './report-guests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportGuestsComponent {
  private readonly api = inject(ReportsApiService);
  readonly i18n = inject(TranslationService);

  readonly branchId = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();

  private readonly load = reportLoader({ branchId: this.branchId, from: this.from, to: this.to }, (b, r) => this.api.guests(b, r));
  readonly data = this.load.data;
  readonly loading = this.load.loading;
  readonly failed = this.load.failed;

  readonly search = signal('');
  readonly filter = signal<GuestFilter>('all');
  readonly filters: GuestFilter[] = ['all', 'returning', 'new'];

  private locale(): string {
    return this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB';
  }

  readonly rows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const f = this.filter();
    return (this.data()?.rows ?? []).filter(
      (r) =>
        (f === 'all' || (f === 'returning' ? r.returning : !r.returning)) &&
        (!q || [r.name, r.phone, r.cnic, r.country].some((v) => (v ?? '').toLowerCase().includes(q))),
    );
  });

  readonly maxCountry = computed(() => Math.max(1, ...(this.data()?.byCountry ?? []).map((c) => c.count)));

  readonly chartData = computed(() => {
    this.i18n.currentLang();
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };
    return {
      labels: d.series.map((s) => bucketLabel(s.key, d.range.groupBy, this.locale(), this.i18n.t('rp.week'))),
      datasets: [
        { label: this.i18n.t('rp.gu.arrivals'), data: d.series.map((s) => s.arrivals), backgroundColor: REPORT_COLORS.guests, borderRadius: 5 },
        { label: this.i18n.t('rp.gu.newGuests'), data: d.series.map((s) => s.newGuests), backgroundColor: REPORT_COLORS.newGuests, borderRadius: 5 },
      ],
    };
  });
  readonly chartOptions = barOptions();

  export(): void {
    const d = this.data();
    if (!d) return;
    downloadCsv(
      `guests-${d.range.from}_${d.range.to}.csv`,
      ['Guest', 'Phone', 'CNIC', 'Country', 'Stays', 'Nights', 'People', 'First visit', 'Last visit', 'Returning', 'New guest'],
      d.rows.map((r) => [r.name, r.phone, r.cnic, r.country, r.stays, r.nights, r.people, r.firstVisit, r.lastVisit, r.returning ? 'Yes' : 'No', r.newlyRegistered ? 'Yes' : 'No']),
    );
  }
}
