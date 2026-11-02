import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import type { PermissionCatalog } from '../../core/models/permissions.model';
import { PERMISSION_MATRIX_DICTIONARY } from './permission-matrix.dictionary';

let nextUid = 0;

/**
 * Choose what a user may do: one card per screen, each action a checkbox with its label beside it.
 * Two-way binds the selected permission keys (`module.action`) through `[(value)]`;
 * `catalog` comes from GET /meta/permissions.
 */
@Component({
  selector: 'app-permission-matrix',
  imports: [FormsModule, Checkbox, Button, TranslatePipe],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionMatrixComponent {
  readonly i18n = inject(TranslationService);

  readonly catalog = input.required<PermissionCatalog | null>();
  readonly value = model<string[]>([]);
  /** Role whose defaults the "reset" button restores. */
  readonly roleForDefaults = input<string | null>(null);
  readonly disabled = input(false);

  /** Unique prefix so checkbox ids (and their <label for>) stay distinct if two editors share a page. */
  readonly uid = `perm${nextUid++}`;

  readonly totalCount = computed(() =>
    (this.catalog()?.modules ?? []).reduce((sum, m) => sum + m.actions.length, 0),
  );

  constructor() {
    this.i18n.register(PERMISSION_MATRIX_DICTIONARY);
  }

  key(module: string, action: string): string {
    return `${module}.${action}`;
  }

  has(module: string, action: string): boolean {
    return this.value().includes(this.key(module, action));
  }

  toggle(module: string, action: string, checked: boolean): void {
    const k = this.key(module, action);
    const next = this.value().filter((p) => p !== k);
    if (checked) next.push(k);
    this.value.set(next);
  }

  selectedCount(module: string, actions: string[]): number {
    return actions.filter((a) => this.has(module, a)).length;
  }

  moduleAll(module: string, actions: string[]): boolean {
    return actions.every((a) => this.has(module, a));
  }

  toggleModule(module: string, actions: string[], checked: boolean): void {
    const keys = actions.map((a) => this.key(module, a));
    const next = this.value().filter((p) => !keys.includes(p));
    if (checked) next.push(...keys);
    this.value.set(next);
  }

  selectAll(): void {
    this.value.set((this.catalog()?.modules ?? []).flatMap((m) => m.actions.map((a) => this.key(m.module, a))));
  }

  clearAll(): void {
    this.value.set([]);
  }

  resetDefaults(): void {
    const role = this.roleForDefaults();
    if (role) this.value.set([...(this.catalog()?.roleDefaults[role] ?? [])]);
  }
}
