import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-stat-card',
  imports: [Card, NgIcon],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>('lucideActivity');
  readonly hint = input<string>();
  readonly tone = input<'default' | 'success' | 'warn' | 'danger'>('default');
}
