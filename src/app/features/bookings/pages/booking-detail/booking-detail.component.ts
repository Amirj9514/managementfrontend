import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { BookingDetailBodyComponent } from '../../components/booking-detail-body/booking-detail-body.component';

/**
 * Thin routed wrapper around `BookingDetailBodyComponent`, kept around so `/bookings/:id`
 * still works as a direct, shareable/bookmarkable deep link. Everywhere else in the app
 * opens the same body inside the booking-detail drawer instead — see
 * `BookingDetailDrawerService`.
 */
@Component({
  selector: 'app-booking-detail',
  imports: [PageHeaderComponent, Button, BookingDetailBodyComponent],
  templateUrl: './booking-detail.component.html',
  styleUrl: './booking-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = this.route.snapshot.paramMap.get('id')!;

  back(): void {
    void this.router.navigate(['/bookings']);
  }
}
