import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { AUTH_DICTIONARY } from '../auth.dictionary';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Button, Fluid, InputText, FieldErrorComponent, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  readonly i18n = inject(TranslationService);

  constructor() {
    this.i18n.register(AUTH_DICTIONARY);
  }

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submitting = false;

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting = false;
        void this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.submitting = false;
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('auth.register.failedSummary'),
          detail: this.i18n.t('auth.register.failedDetail'),
        });
      },
    });
  }
}
