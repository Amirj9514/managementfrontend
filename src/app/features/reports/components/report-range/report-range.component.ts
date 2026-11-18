import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { addDaysFromToday } from '../../../../core/utils/date-key';
import { REPORT_PRESETS, presetRange, type ReportPreset } from '../../reports.util';

/**
 * The period picker every report shares: quick periods (today, 7 days, 30 days, this/last month, this year) or a
 * custom start and end date. Changing either date switches to "Custom"; the end can never be before the start.
 */
@Component({
  selector: 'app-report-range',
  imports: [FormsModule, DatePicker, TranslatePipe],
  template: `
    <div class="rr">
      <div class="rr__chips" role="radiogroup" [attr.aria-label]="'rp.period' | translate">
        @for (p of presets; track p) {
          <button type="button" class="rr__chip" role="radio" [class.rr__chip--on]="preset() === p" [attr.aria-checked]="preset() === p" (click)="pick(p)">
            {{ 'rp.preset.' + p | translate }}
          </button>
        }
      </div>
      <div class="rr__dates">
        <label class="rr__field">
          <span>{{ 'rp.from' | translate }}</span>
          <p-datepicker [ngModel]="from()" (ngModelChange)="setFrom($event)" [maxDate]="maxDate" [showIcon]="true" dateFormat="d M yy" appendTo="body" />
        </label>
        <label class="rr__field">
          <span>{{ 'rp.to' | translate }}</span>
          <p-datepicker [ngModel]="to()" (ngModelChange)="setTo($event)" [maxDate]="maxDate" [showIcon]="true" dateFormat="d M yy" appendTo="body" />
        </label>
        <span class="rr__text"><i class="pi pi-calendar"></i> {{ summary() }}</span>
      </div>
    </div>
  `,
  styles: `
    $border: var(--p-content-border-color, rgba(127, 127, 127, 0.25));
    $muted: var(--p-text-muted-color, #64748b);

    .rr {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
    }

    .rr__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .rr__chip {
      padding: 0.35rem 0.9rem;
      font: inherit;
      font-size: 0.86rem;
      font-weight: 600;
      color: inherit;
      cursor: pointer;
      border-radius: 999px;
      border: 1px solid $border;
      background: var(--p-content-background, #fff);
      transition: border-color 0.15s ease, background 0.15s ease;

      &:hover {
        border-color: var(--p-primary-color);
      }

      &:focus-visible {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
      }

      &--on {
        color: var(--p-primary-contrast-color, #fff);
        border-color: var(--p-primary-color);
        background: var(--p-primary-color);
      }
    }

    .rr__dates {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0.75rem;
    }

    .rr__field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: $muted;
    }

    .rr__text {
      margin-inline-start: auto;
      font-size: 0.86rem;
      color: $muted;

      i {
        margin-inline-end: 0.3rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportRangeComponent {
  private readonly i18n = inject(TranslationService);

  readonly preset = model<ReportPreset>('7d');
  readonly from = model.required<Date>();
  readonly to = model.required<Date>();

  readonly presets = REPORT_PRESETS;
  readonly maxDate = addDaysFromToday(0);

  readonly summary = computed(() => {
    this.i18n.currentLang();
    const fmt = new Intl.DateTimeFormat(this.i18n.currentLang() === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const days = Math.round((this.to().getTime() - this.from().getTime()) / 86400000) + 1;
    const same = this.from().getTime() === this.to().getTime();
    return same ? fmt.format(this.from()) : this.i18n.t('rp.rangeText', { from: fmt.format(this.from()), to: fmt.format(this.to()), days });
  });

  pick(p: ReportPreset): void {
    this.preset.set(p);
    if (p === 'custom') return;
    const r = presetRange(p);
    this.from.set(r.from);
    this.to.set(r.to);
  }

  setFrom(d: Date | null): void {
    if (!d) return;
    this.preset.set('custom');
    this.from.set(d);
    if (this.to() < d) this.to.set(d);
  }

  setTo(d: Date | null): void {
    if (!d) return;
    this.preset.set('custom');
    this.to.set(d);
    if (this.from() > d) this.from.set(d);
  }
}
