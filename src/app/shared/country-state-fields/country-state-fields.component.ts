import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { COUNTRIES, STATES_BY_COUNTRY } from '../../core/data/countries';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

/**
 * Country + State/Province pair for guest forms (new-guest drawer in check-in, Guests page
 * dialog). Country is a searchable list; State is a list when we know the country's provinces,
 * otherwise free text. Changing the country clears a state that doesn't belong to it.
 */
@Component({
  selector: 'app-country-state-fields',
  imports: [ReactiveFormsModule, Select, InputText, TranslatePipe],
  template: `
    <div class="country-state">
      <div class="field">
        <label [for]="idPrefix() + '-country'">{{ 'common.country' | translate }}</label>
        <p-select [inputId]="idPrefix() + '-country'" [formControl]="countryControl()" [options]="countries"
          [filter]="true" filterBy="label" [showClear]="true" [placeholder]="'common.selectCountry' | translate"
          appendTo="body" styleClass="w-full" />
      </div>
      <div class="field">
        <label [for]="idPrefix() + '-state'">{{ 'common.state' | translate }}</label>
        @if (stateOptions().length) {
          <p-select [inputId]="idPrefix() + '-state'" [formControl]="stateControl()" [options]="stateOptions()"
            [filter]="true" [editable]="true" [showClear]="true" [placeholder]="'common.selectState' | translate"
            appendTo="body" styleClass="w-full" />
        } @else {
          <input pInputText [id]="idPrefix() + '-state'" [formControl]="stateControl()" autocomplete="off"
            [placeholder]="'common.enterState' | translate" class="w-full" />
        }
      </div>
    </div>
  `,
  styles: `
    .country-state {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .country-state .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0;
    }
    @media (max-width: 480px) {
      .country-state {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryStateFieldsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly countryControl = input.required<FormControl<string>>();
  readonly stateControl = input.required<FormControl<string>>();
  readonly idPrefix = input('cs');

  readonly countries = COUNTRIES.map((c) => ({ label: c, value: c }));
  private readonly country = signal('');
  readonly stateOptions = computed(() => [...(STATES_BY_COUNTRY[this.country()] ?? [])]);

  ngOnInit(): void {
    const countryCtrl = this.countryControl();
    this.country.set(countryCtrl.value ?? '');
    countryCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const next = value ?? '';
      if (next === this.country()) return;
      this.country.set(next);
      const state = this.stateControl().value;
      const known = STATES_BY_COUNTRY[next];
      // A province typed/picked for the old country almost never applies to the new one.
      if (state && (!known || !known.includes(state))) this.stateControl().setValue('');
    });
  }
}
