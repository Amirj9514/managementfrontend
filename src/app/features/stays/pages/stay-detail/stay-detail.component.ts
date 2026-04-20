import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import type { Stay } from '../../../../core/models/entity-stubs.model';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { StaysApiService } from '../../services/stays-api.service';

@Component({
  selector: 'app-stay-detail',
  imports: [Button, Card, Skeleton, PageHeaderComponent],
  templateUrl: './stay-detail.component.html',
  styleUrl: './stay-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StayDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StaysApiService);

  readonly stay = signal<Stay | null>(null);
  readonly loading = signal(true);

  constructor() {
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

  folio(id: string): void {
    void this.router.navigate(['/stays', id, 'folio']);
  }
}
