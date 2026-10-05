import { ChangeDetectorRef, type OnDestroy, Pipe, type PipeTransform, inject } from '@angular/core';
import type { Subscription } from 'rxjs';
import { TranslationService } from './translation.service';

/**
 * `{{ 'some.key' | translate }}` or `{{ 'some.key' | translate: { name: guest.fullName } }}`.
 *
 * Marked impure so Angular re-invokes transform() on every change-detection pass of the host
 * view, and subscribes to the service's langChanged$ to call markForCheck() on that host view —
 * OnPush components otherwise have no way to know a signal read *inside* a pipe changed, since
 * the template only ever sees a literal string key being passed in, not a live binding.
 */
@Pipe({ name: 'translate', pure: false, standalone: true })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly i18n = inject(TranslationService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.i18n.langChanged$.subscribe(() => this.cdRef.markForCheck());
  }

  transform(key: string | null | undefined, params?: Record<string, string | number>): string {
    if (!key) return '';
    return this.i18n.t(key, params);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
