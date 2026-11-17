import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { GUESTS_DICTIONARY } from '../../features/guests/guests.dictionary';
import { CountryStateFieldsComponent } from '../country-state-fields/country-state-fields.component';
import { FieldErrorComponent } from '../field-error/field-error.component';

/**
 * The one guest form, used by the Guests page and by the new-guest drawer in the check-in flow, so a guest is
 * captured the same way everywhere: identity, contact, address, notes. The parent owns the FormGroup
 * (fullName, cnic, phone, email, address, country, state, notes) and the buttons.
 */
@Component({
  selector: 'app-guest-form',
  imports: [
    ReactiveFormsModule,
    IconField,
    InputIcon,
    InputText,
    Textarea,
    CountryStateFieldsComponent,
    FieldErrorComponent,
    TranslatePipe,
  ],
  templateUrl: './guest-form.component.html',
  styleUrl: './guest-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestFormComponent {
  readonly form = input.required<FormGroup>();
  /** Keeps element ids unique when two forms exist on one page. */
  readonly idPrefix = input('gf');

  constructor() {
    inject(TranslationService).register(GUESTS_DICTIONARY);
  }

  control(name: string): FormControl<string> {
    return this.form().get(name) as FormControl<string>;
  }

  /** Initials for the preview bubble; typing in the form re-renders this view, so a plain method is enough. */
  initials(): string {
    const name = (this.control('fullName').value ?? '').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    return name ? ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase() : '';
  }

  notesLength(): number {
    return (this.control('notes').value ?? '').length;
  }
}
