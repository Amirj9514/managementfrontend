import { Directive, EmbeddedViewRef, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive that renders its content only when the signed-in user holds at least one of
 * the given permissions (admins and super admins always pass).
 *
 *   <p-button *appCan="'bookings.create'" ... />
 *   <th *appCan="['guests.edit', 'guests.delete']">Actions</th>
 */
@Directive({ selector: '[appCan]', standalone: true })
export class CanDirective {
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private view: EmbeddedViewRef<unknown> | null = null;

  readonly appCan = input.required<string | readonly string[]>();

  constructor() {
    effect(() => {
      const keys = this.appCan();
      const allowed = this.auth.can(...(typeof keys === 'string' ? [keys] : keys));
      if (allowed && !this.view) {
        this.view = this.container.createEmbeddedView(this.template);
      } else if (!allowed && this.view) {
        this.container.clear();
        this.view = null;
      }
    });
  }
}
