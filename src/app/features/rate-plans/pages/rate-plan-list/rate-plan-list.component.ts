import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import type { RatePlan } from '../../../../core/models/entity-stubs.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { RatePlansApiService } from '../../services/rate-plans-api.service';

@Component({
  selector: 'app-rate-plan-list',
  imports: [Card, TableModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './rate-plan-list.component.html',
  styleUrl: './rate-plan-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatePlanListComponent {
  private readonly api = inject(RatePlansApiService);

  readonly rows = signal<RatePlan[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
