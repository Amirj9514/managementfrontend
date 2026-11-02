import { Injectable, inject } from '@angular/core';
import { ConfirmationService, type Confirmation, type ConfirmEventType } from 'primeng/api';
import { Observable } from 'rxjs';
import { TranslationService } from '../i18n/translation.service';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

/** PrimeNG's confirmation options plus a `variant` that picks the icon and button colour. */
export type ConfirmOptions = Confirmation & { variant?: ConfirmVariant };

const VARIANT_ICON: Record<ConfirmVariant, string> = {
  danger: 'pi pi-exclamation-triangle',
  warning: 'pi pi-exclamation-circle',
  info: 'pi pi-info-circle',
  success: 'pi pi-check-circle',
};

const VARIANT_ACCEPT_CLASS: Record<ConfirmVariant, string> = {
  danger: 'p-button-danger',
  warning: 'p-button-warn',
  info: '',
  success: 'p-button-success',
};

/**
 * The one way to ask "are you sure?" in this app. Every screen goes through here and the single
 * <p-confirmdialog> in the app root renders it, so confirmations always look and behave the same:
 * translated Confirm / Cancel buttons, Cancel focused by default, Esc and the X dismiss it, and a
 * second request while one is already open is ignored (so double-clicks can never stack popups).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly confirmation = inject(ConfirmationService);
  private readonly i18n = inject(TranslationService);
  private open = false;

  /** Callback style — same shape as PrimeNG's `confirm({ header, message, accept })`. */
  confirm(options: ConfirmOptions): void {
    if (this.open) return;
    this.open = true;

    const { variant: explicit, accept, reject, ...rest } = options;
    const variant: ConfirmVariant =
      explicit ?? (rest.acceptButtonStyleClass?.includes('danger') ? 'danger' : 'warning');

    this.confirmation.confirm({
      icon: VARIANT_ICON[variant],
      acceptLabel: this.i18n.t('common.confirm'),
      rejectLabel: this.i18n.t('common.cancel'),
      acceptButtonStyleClass: VARIANT_ACCEPT_CLASS[variant],
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      defaultFocus: 'reject',
      closable: true,
      closeOnEscape: true,
      dismissableMask: false,
      ...rest,
      accept: () => {
        this.open = false;
        accept?.();
      },
      reject: (type?: ConfirmEventType) => {
        this.open = false;
        reject?.(type);
      },
    });
  }

  /** Observable style: emits `true` if confirmed, `false` if cancelled/dismissed, then completes. */
  ask(options: Omit<ConfirmOptions, 'accept' | 'reject'>): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.confirm({
        ...options,
        accept: () => {
          subscriber.next(true);
          subscriber.complete();
        },
        reject: () => {
          subscriber.next(false);
          subscriber.complete();
        },
      });
    });
  }

  /** Called by the root dialog when it closes for any reason, so a dismissed popup never blocks the next one. */
  closed(): void {
    this.open = false;
  }
}
