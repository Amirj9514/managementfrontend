import { AsyncPipe } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { MenuItem } from 'primeng/api';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { Menu } from 'primeng/menu';
import { AuthService } from '../../core/services/auth.service';
import { NAV_GROUPS } from '../../core/config/nav-items';
import type { NavItem } from '../../core/config/nav-items';
import type { AuthUser } from '../../core/models/user.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { AnnouncementNotifierService } from '../../core/services/announcement-notifier.service';
import { AnnouncementPopupComponent } from '../../shared/announcement-popup/announcement-popup.component';
import { BookingDetailDrawerComponent } from '../../shared/booking-detail-drawer/booking-detail-drawer.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-shell',
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    Button,
    Drawer,
    Menu,
    BookingDetailDrawerComponent,
    AnnouncementPopupComponent,
    BreadcrumbComponent,
    TranslatePipe,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  readonly i18n = inject(TranslationService);

  readonly user$ = this.auth.user$;

  constructor() {
    // Pick up permission changes an admin made since this user last signed in.
    // Once the profile is fresh: surface unread announcements now and remind every 10 minutes.
    const announcements = inject(AnnouncementNotifierService);
    this.auth.ensureFresh().subscribe(() => announcements.start());
    inject(DestroyRef).onDestroy(() => announcements.stop());

    // Only the shell's main area scrolls while signed in (see body.has-shell in _layout.scss).
    const body = inject(DOCUMENT).body;
    body.classList.add('has-shell');
    inject(DestroyRef).onDestroy(() => body.classList.remove('has-shell'));
  }
  readonly navGroups = NAV_GROUPS;
  readonly sidebarCollapsed = signal(false);
  readonly mobileDrawerOpen = signal(false);

  /** Computed (not a plain field) so it recomputes — and PrimeNG's [model] input sees a new
   *  array reference — whenever the language changes. */
  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: this.i18n.t('shell.logout'),
      command: () => this.auth.logout(),
    },
  ]);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((c) => !c);
  }

  openMobileNav(): void {
    this.mobileDrawerOpen.set(true);
  }

  closeMobileNav(): void {
    this.mobileDrawerOpen.set(false);
  }

  filteredItems(items: NavItem[], user: AuthUser | null): NavItem[] {
    if (!user) {
      return [];
    }
    return items.filter((i) => this.auth.canSeeNavItem(i, user));
  }
}
