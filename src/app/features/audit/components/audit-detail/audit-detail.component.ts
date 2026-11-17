import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import type { AuditRow } from '../../../../core/models/audit.model';
import { BookingDetailDrawerService } from '../../../bookings/services/booking-detail-drawer.service';
import { AuditPresenter } from '../../services/audit-presenter.service';

/**
 * Slide-over with everything about one audit entry, in plain language first (what happened, who, when,
 * what it touched, the values submitted) and the technical bits (codes, IP, device, raw data) last.
 */
@Component({
  selector: 'app-audit-detail',
  imports: [Drawer, Button, TranslatePipe],
  templateUrl: './audit-detail.component.html',
  styleUrl: './audit-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditDetailComponent {
  private readonly router = inject(Router);
  private readonly bookingDrawer = inject(BookingDetailDrawerService);
  readonly p = inject(AuditPresenter);

  readonly row = input<AuditRow | null>(null);
  readonly hasNewer = input(false);
  readonly hasOlder = input(false);
  readonly closed = output<void>();
  readonly newer = output<void>();
  readonly older = output<void>();

  readonly showRaw = signal(false);
  readonly copiedKey = signal<string | null>(null);

  readonly meta = computed(() => (this.row() ? this.p.meta(this.row()!.action) : null));
  readonly entries = computed(() => this.p.entries(this.row()?.payload));
  readonly initials = computed(() => {
    const name = this.row()?.actor?.name ?? '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    return name ? ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase() : '';
  });
  readonly raw = computed(() => JSON.stringify(this.row(), null, 2));

  /** Records we can jump to from here. */
  readonly canOpen = computed(() => {
    const r = this.row();
    return !!r?.entityId && (r.entityType === 'Booking' || r.entityType === 'Guest') && !!r.targetLabel;
  });

  open(): void {
    const r = this.row();
    if (!r?.entityId) return;
    this.closed.emit();
    if (r.entityType === 'Booking') this.bookingDrawer.open(r.entityId);
    else if (r.entityType === 'Guest') void this.router.navigate(['/guests', r.entityId]);
  }

  async copy(key: string, text: string | null): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copiedKey.set(key);
      setTimeout(() => this.copiedKey.update((k) => (k === key ? null : k)), 1500);
    } catch {
      /* clipboard blocked (plain http): nothing to do, the value is selectable on screen */
    }
  }
}
