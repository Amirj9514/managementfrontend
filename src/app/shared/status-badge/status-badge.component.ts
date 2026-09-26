import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-status-badge',
  imports: [Tag],
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly severityMap = input<Record<string, Severity>>({});

  readonly label = computed(() =>
    this.status()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  );

  readonly severity = computed<Severity>(() => this.severityMap()[this.status()] ?? 'secondary');
}
