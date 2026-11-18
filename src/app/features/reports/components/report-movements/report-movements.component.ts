import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { UIChart as Chart } from 'primeng/chart';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import type { MovementRow } from '../../../../core/models/report.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { reportLoader } from '../../report-loader';
import { REPORT_COLORS, barOptions, bucketLabel, downloadCsv, minutesText } from '../../reports.util';
import { ReportsApiService } from '../../services/reports-api.service';

/** Check-ins or check-outs that really happened in the period: totals, trend, where, and every stay. */
@Component({
  selector: 'app-report-movements',
  imports: [DatePipe, FormsModule, Button, Chart, IconField, InputIcon, InputText, Skeleton, TableModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './report-movements.component.html',
  styleUrl: './report-movements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportMovementsComponent {
  private readonly api = inject(ReportsApiService);
  readonly i18n = inject(TranslationService);

  readonly kind = input.required<'in' | 'out'>();
  readonly branchId = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();

  private readonly load = reportLoader({ branchId: this.branchId, from: this.from, to: this.to }, (b, r) =>
    this.kind() === 'in' ? this.api.checkIns(b, r) : this.api.checkOuts(b, r),
  );
  readonly data = this.load.data;
  readonly loading = this.load.loading;
  readonly failed = this.load.failed;

  readonly search = signal('');
  readonly isIn = computed(() => this.kind() === 'in');
  readonly minutesText = minutesText;

  private locale(): string {
    return this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB';
  }

  readonly rows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const all = this.data()?.rows ?? [];
    if (!q) return all;
    return all.filter((r) =>
      [r.guestName, r.guestPhone, r.bookingNumber, r.unitCode, r.buildingName, r.floorLabel].some((v) => (v ?? '').toLowerCase().includes(q)),
    );
  });

  readonly maxBuilding = computed(() => Math.max(1, ...(this.data()?.byBuilding ?? []).map((b) => b.count)));

  readonly chartData = computed(() => {
    this.i18n.currentLang();
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };
    const color = this.isIn() ? REPORT_COLORS.checkIns : REPORT_COLORS.checkOuts;
    return {
      labels: d.series.map((s) => bucketLabel(s.key, d.range.groupBy, this.locale(), this.i18n.t('rp.week'))),
      datasets: [
        { label: this.i18n.t(this.isIn() ? 'rp.kpi.checkIns' : 'rp.kpi.checkOuts'), data: d.series.map((s) => s.count), backgroundColor: color, borderRadius: 5 },
      ],
    };
  });
  readonly chartOptions = { ...barOptions(), plugins: { legend: { display: false } } };

  /** "BK-0012" with a leading hint of the type, used in the table. */
  placeOf(r: MovementRow): string {
    return [r.buildingName, r.floorLabel].filter(Boolean).join(' · ') || '—';
  }

  export(): void {
    const d = this.data();
    if (!d) return;
    const name = this.isIn() ? 'check-ins' : 'check-outs';
    downloadCsv(
      `${name}-${d.range.from}_${d.range.to}.csv`,
      ['Booking #', 'Guest', 'Phone', 'Room/Hall', 'Type', 'Building', 'Floor', this.isIn() ? 'Checked in at' : 'Checked out at', 'Expected check-out', 'Planned nights', 'Stayed nights', 'Guests', 'Late (min)'],
      d.rows.map((r) => [
        r.bookingNumber,
        r.guestName,
        r.guestPhone,
        r.unitCode,
        r.unitType === 'public_hall' ? 'Hall' : 'Room',
        r.buildingName,
        r.floorLabel,
        r.at,
        r.expectedCheckOut,
        r.plannedNights,
        r.stayNights,
        r.guests,
        r.late ? r.lateMinutes : '',
      ]),
    );
  }
}
