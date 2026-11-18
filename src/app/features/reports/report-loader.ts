import { DestroyRef, effect, inject, signal, untracked, type Signal } from '@angular/core';
import type { Observable, Subscription } from 'rxjs';

/**
 * Loads a report whenever its branch or period changes. A request still in flight when the inputs change is
 * cancelled, so a slow old answer can never overwrite a newer one. Call from a component constructor.
 */
export function reportLoader<T>(
  inputs: { branchId: Signal<string>; from: Signal<string>; to: Signal<string> },
  fetch: (branchId: string, range: { from: string; to: string }) => Observable<T>,
) {
  const data = signal<T | null>(null);
  const loading = signal(true);
  const failed = signal(false);
  let sub: Subscription | undefined;
  inject(DestroyRef).onDestroy(() => sub?.unsubscribe());

  effect(() => {
    const branchId = inputs.branchId();
    const from = inputs.from();
    const to = inputs.to();
    untracked(() => {
      sub?.unsubscribe();
      loading.set(true);
      failed.set(false);
      sub = fetch(branchId, { from, to }).subscribe({
        next: (d) => {
          data.set(d);
          loading.set(false);
        },
        error: () => {
          failed.set(true);
          loading.set(false);
        },
      });
    });
  });

  return { data, loading, failed };
}
