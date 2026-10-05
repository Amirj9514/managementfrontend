import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { FORBIDDEN_DICTIONARY } from './forbidden.dictionary';

@Component({
  selector: 'app-forbidden',
  imports: [Button, Card, TranslatePipe],
  templateUrl: './forbidden.component.html',
  styleUrl: './forbidden.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  constructor() {
    this.i18n.register(FORBIDDEN_DICTIONARY);
  }

  goHome(): void {
    void this.router.navigate(['/dashboard']);
  }
}
