import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import type { Stay } from '../../../../core/models/entity-stubs.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StaysApiService } from '../../services/stays-api.service';

@Component({
  selector: 'app-stay-list',
  imports: [Button, Card, TableModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './stay-list.component.html',
  styleUrl: './stay-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StayListComponent {
  private readonly api = inject(StaysApiService);
  private readonly router = inject(Router);

  readonly rows = signal<Stay[]>([]);
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

  open(id: string): void {
    void this.router.navigate(['/stays', id]);
  }
}
