import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import type { Stay } from '../../../../core/models/entity-stubs.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge.component';
import { StaysApiService } from '../../services/stays-api.service';
import { STAYS_DICTIONARY } from '../../stays.dictionary';

@Component({
  selector: 'app-stay-detail',
  imports: [Button, Card, Skeleton, PageHeaderComponent, StatusBadgeComponent, TranslatePipe],
  templateUrl: './stay-detail.component.html',
  styleUrl: './stay-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StayDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StaysApiService);
  readonly i18n = inject(TranslationService);

  readonly stay = signal<Stay | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.i18n.register(STAYS_DICTIONARY);
    const id =
      this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.api.getById(id).subscribe({
      next: (s) => {
        this.stay.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  back(): void {
    void this.router.navigate(['/stays']);
  }
}
