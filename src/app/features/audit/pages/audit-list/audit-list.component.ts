import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import type { AuditLogEntry } from '../../../../core/models/entity-stubs.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { AuditApiService } from '../../services/audit-api.service';
import { AUDIT_DICTIONARY } from '../../audit.dictionary';

@Component({
  selector: 'app-audit-list',
  imports: [Card, TableModule, PageHeaderComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent {
  private readonly api = inject(AuditApiService);
  private readonly i18n = inject(TranslationService);

  readonly rows = signal<AuditLogEntry[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.i18n.register(AUDIT_DICTIONARY);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
