import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { AUTH_DICTIONARY } from '../../features/auth/auth.dictionary';

/** Sign-in / register frame: the property photo and brand on one side, the form on the other (a banner on small screens). */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  readonly i18n = inject(TranslationService);

  constructor() {
    this.i18n.register(AUTH_DICTIONARY);
  }
}
