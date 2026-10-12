import { Component, computed, effect, inject, input, signal } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { TranslationService } from '../../core/i18n/translation.service';

/**
 * Inline validation message shown under a form field once it's touched/dirty and invalid.
 *
 * Control state (touched/errors) mutates in place and is not a signal — so we subscribe to
 * `control.events` (value/status/touched/pristine) and bump an epoch signal, otherwise a
 * `computed()` would cache the initial empty message and never show errors after Submit
 * calls `markAllAsTouched()`.
 */
@Component({
  selector: 'app-field-error',
  template: `@if (message()) {
    <small class="app-field-error">{{ message() }}</small>
  }`,
  styles: [
    `
      .app-field-error {
        display: block;
        margin-top: 0.25rem;
        color: var(--p-red-500);
        font-size: 0.8rem;
      }
    `,
  ],
})
export class FieldErrorComponent {
  private readonly i18n = inject(TranslationService);

  /** The control to watch. Pass `form.controls.fieldName`. */
  readonly control = input<AbstractControl | null | undefined>(null);
  /** Human label used in default messages, e.g. "Email" -> "Email is required." — pass an
   *  already-translated string (e.g. `i18n.t('guests.email')`). */
  readonly label = input<string>();
  /** Override/add messages per error key, e.g. `{ email: 'Enter a valid email address.' }`. */
  readonly messages = input<Record<string, string>>({});

  /** Incremented whenever the bound control emits, so `message` recomputes. */
  private readonly controlEpoch = signal(0);

  constructor() {
    effect((onCleanup) => {
      const c = this.control();
      this.controlEpoch.update((n) => n + 1);
      if (!c) return;
      const sub = c.events.subscribe(() => this.controlEpoch.update((n) => n + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly message = computed<string | null>(() => {
    this.controlEpoch();
    // Re-read language so messages update when the user toggles EN/UR.
    this.i18n.currentLang();

    const c = this.control();
    if (!c || c.valid || !(c.touched || c.dirty)) return null;
    const errors = c.errors;
    if (!errors) return null;

    const overrides = this.messages();
    const label = this.label() ?? this.i18n.t('validation.defaultLabel');
    const firstKey = Object.keys(errors)[0];
    if (overrides[firstKey]) return overrides[firstKey];

    // Server-provided message (already localized by the API)
    if (firstKey === 'server' && typeof errors['server'] === 'string') {
      return errors['server'];
    }

    switch (firstKey) {
      case 'required':
        return this.i18n.t('validation.required', { label });
      case 'email':
        return this.i18n.t('validation.email');
      case 'min':
        return this.i18n.t('validation.min', { label, min: errors['min'].min });
      case 'max':
        return this.i18n.t('validation.max', { label, max: errors['max'].max });
      case 'minlength':
        return this.i18n.t('validation.minlength', { label, length: errors['minlength'].requiredLength });
      case 'maxlength':
        return this.i18n.t('validation.maxlength', { label, length: errors['maxlength'].requiredLength });
      case 'pattern':
        return this.i18n.t('validation.pattern', { label });
      default:
        return this.i18n.t('validation.invalid', { label });
    }
  });
}
