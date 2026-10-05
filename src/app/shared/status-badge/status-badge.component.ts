import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { TranslationService } from '../../core/i18n/translation.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

function toTitleCase(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toStatusKey(status: string): string {
  const camel = status.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  return `status.${camel}`;
}

@Component({
  selector: 'app-status-badge',
  imports: [Tag],
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  private readonly i18n = inject(TranslationService);

  readonly status = input.required<string>();
  readonly severityMap = input<Record<string, Severity>>({});

  /** Translates via a `status.<camelCase>` key (e.g. "checked_in" → "status.checkedIn") when
   *  one exists in the dictionary; falls back to a title-cased raw status for any value not
   *  yet covered, so an unrecognized status never renders blank. */
  readonly label = computed(() => {
    this.i18n.currentLang();
    const key = toStatusKey(this.status());
    const translated = this.i18n.t(key);
    return translated === key ? toTitleCase(this.status()) : translated;
  });

  readonly severity = computed<Severity>(() => this.severityMap()[this.status()] ?? 'secondary');
}
