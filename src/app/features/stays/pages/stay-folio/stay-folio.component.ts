import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-stay-folio',
  imports: [Button, Card, PageHeaderComponent],
  templateUrl: './stay-folio.component.html',
  styleUrl: './stay-folio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StayFolioComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly stayId = this.route.parent?.snapshot.paramMap.get('id') ?? '';

  back(): void {
    if (this.stayId) {
      void this.router.navigate(['/stays', this.stayId]);
    } else {
      void this.router.navigate(['/stays']);
    }
  }
}
