import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import {
  ANNOUNCEMENT_TOAST_KEY,
  AnnouncementNotifierService,
} from '../../core/services/announcement-notifier.service';
import { SecureImageComponent } from '../secure-image/secure-image.component';

/**
 * Mounted once in the shell. Shows unread announcements in a dialog when the user signs in, and
 * hosts the toast that reminds them every 10 minutes while anything is still unread.
 */
@Component({
  selector: 'app-announcement-popup',
  imports: [DatePipe, Dialog, Button, Tag, Toast, SecureImageComponent, TranslatePipe],
  templateUrl: './announcement-popup.component.html',
  styleUrl: './announcement-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementPopupComponent {
  readonly notifier = inject(AnnouncementNotifierService);
  readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly toastKey = ANNOUNCEMENT_TOAST_KEY;

  openAll(): void {
    this.notifier.dismissPopup();
    this.messages.clear(ANNOUNCEMENT_TOAST_KEY);
    void this.router.navigate(['/announcements']);
  }
}
