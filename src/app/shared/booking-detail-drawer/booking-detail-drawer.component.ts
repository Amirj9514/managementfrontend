import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Drawer } from 'primeng/drawer';
import { BookingDetailBodyComponent } from '../../features/bookings/components/booking-detail-body/booking-detail-body.component';
import { BookingDetailDrawerService } from '../../features/bookings/services/booking-detail-drawer.service';

/**
 * Mounted once in the shell — renders whichever booking `BookingDetailDrawerService` points
 * to as a right-hand slide-over, so booking details can be inspected from anywhere (booking
 * list, guest history, the new-booking wizard) without leaving the current screen.
 */
@Component({
  selector: 'app-booking-detail-drawer',
  imports: [Drawer, BookingDetailBodyComponent],
  templateUrl: './booking-detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailDrawerComponent {
  readonly drawerSvc = inject(BookingDetailDrawerService);

  onVisibleChange(visible: boolean): void {
    if (!visible) this.drawerSvc.close();
  }
}
