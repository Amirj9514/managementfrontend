import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import type { AuditLogEntry } from '../../../../core/models/entity-stubs.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { AuditApiService } from '../../services/audit-api.service';

@Component({
  selector: 'app-audit-list',
  imports: [Card, TableModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent {
  private readonly api = inject(AuditApiService);

  readonly rows = signal<AuditLogEntry[]>([]);
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
