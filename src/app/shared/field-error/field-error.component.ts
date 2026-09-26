import { Component, computed, input } from '@angular/core';
import type { AbstractControl } from '@angular/forms';

/**
 * Inline validation message shown under a form field once it's touched/dirty and invalid.
 * Deliberately NOT OnPush: reactive-form control state mutates in place (same object
 * reference), so it relies on the app's default zone-triggered change detection to
 * re-evaluate on every keystroke/blur — OnPush would miss those updates.
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
  /** The control to watch. Pass `form.controls.fieldName`. */
  readonly control = input<AbstractControl | null | undefined>(null);
  /** Human label used in default messages, e.g. "Email" -> "Email is required." */
  readonly label = input<string>('This field');
  /** Override/add messages per error key, e.g. `{ email: 'Enter a valid email address.' }`. */
  readonly messages = input<Record<string, string>>({});

  readonly message = computed<string | null>(() => {
    const c = this.control();
    if (!c || c.valid || !(c.touched || c.dirty)) return null;
    const errors = c.errors;
    if (!errors) return null;

    const overrides = this.messages();
    const label = this.label();
    const firstKey = Object.keys(errors)[0];
    if (overrides[firstKey]) return overrides[firstKey];

    switch (firstKey) {
      case 'required':
        return `${label} is required.`;
      case 'email':
        return `Enter a valid email address.`;
      case 'min':
        return `${label} must be at least ${errors['min'].min}.`;
      case 'max':
        return `${label} must be at most ${errors['max'].max}.`;
      case 'minlength':
        return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
      case 'maxlength':
        return `${label} must be at most ${errors['maxlength'].requiredLength} characters.`;
      case 'pattern':
        return `${label} format is invalid.`;
      default:
        return `${label} is invalid.`;
    }
  });
}
