import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-capacity-gauge',
  imports: [ProgressBar],
  templateUrl: './capacity-gauge.component.html',
  styleUrl: './capacity-gauge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacityGaugeComponent {
  readonly capacity = input.required<number>();
  readonly occupied = input.required<number>();
  readonly label = input<string>('Capacity');

  readonly remaining = computed(() => Math.max(this.capacity() - this.occupied(), 0));
  readonly pct = computed(() => (this.capacity() > 0 ? Math.round((this.occupied() / this.capacity()) * 100) : 0));

  readonly barColor = computed(() => {
    const p = this.pct();
    if (p >= 95) return 'var(--p-red-500)';
    if (p >= 75) return 'var(--p-orange-500)';
    return 'var(--p-green-500)';
  });
}
