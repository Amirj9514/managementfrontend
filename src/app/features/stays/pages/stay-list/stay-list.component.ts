import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import type { Stay } from '../../../../core/models/entity-stubs.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { StaysApiService } from '../../services/stays-api.service';
import { STAYS_DICTIONARY } from '../../stays.dictionary';

@Component({
  selector: 'app-stay-list',
  imports: [Button, Card, TableModule, PageHeaderComponent, EmptyStateComponent, StatusBadgeComponent, TranslatePipe],
  templateUrl: './stay-list.component.html',
  styleUrl: './stay-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StayListComponent {
  private readonly api = inject(StaysApiService);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly rows = signal<Stay[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.i18n.register(STAYS_DICTIONARY);
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
