import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import { GUEST_WRITE_ROLES } from '../../../../core/models/roles.model';
import type { Guest } from '../../../../core/models/guest.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { GuestApiService } from '../../services/guest-api.service';

@Component({
  selector: 'app-guest-detail',
  imports: [Button, Card, Skeleton, PageHeaderComponent],
  templateUrl: './guest-detail.component.html',
  styleUrl: './guest-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly guestsApi = inject(GuestApiService);
  private readonly auth = inject(AuthService);

  readonly guest = signal<Guest | null>(null);
  readonly loading = signal(true);
  readonly canWrite = signal(false);

  constructor() {
    const user = this.auth.getUser();
    this.canWrite.set(!!user && GUEST_WRITE_ROLES.includes(user.role));
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.guestsApi.getById(id).subscribe({
      next: (g) => {
        this.guest.set(g);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  back(): void {
    void this.router.navigate(['/guests']);
  }

  edit(id: string): void {
    void this.router.navigate(['/guests', id, 'edit']);
  }
}
