import { Component, computed, inject, input } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { TranslationService } from '../../core/i18n/translation.service';

/**
 * Inline validation message shown under a form field once it's touched/dirty and invalid.
 * Deliberately NOT OnPush: reactive-form control state mutates in place (same object
 * reference), so it relies on the app's default zone-triggered change detection to
 * re-evaluate on every keystroke/blur — OnPush would miss those updates. That same
 * zone-triggered CD is also why this needs no special handling to pick up a language change.
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

  readonly message = computed<string | null>(() => {
    const c = this.control();
    if (!c || c.valid || !(c.touched || c.dirty)) return null;
    const errors = c.errors;
    if (!errors) return null;

    const overrides = this.messages();
    const label = this.label() ?? this.i18n.t('validation.defaultLabel');
    const firstKey = Object.keys(errors)[0];
    if (overrides[firstKey]) return overrides[firstKey];

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
