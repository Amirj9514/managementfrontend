import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService, type MenuItem } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Paginator } from 'primeng/paginator';
import type { PaginatorState } from 'primeng/paginator';
import { SelectButton } from 'primeng/selectbutton';
import { GuestFormComponent } from '../../../../shared/guest-form/guest-form.component';
import { DEFAULT_COUNTRY } from '../../../../core/data/countries';
import { TableModule } from 'primeng/table';
import { CanDirective } from '../../../../core/directives/can.directive';
import { guestRowId, type Guest } from '../../../../core/models/guest.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { applyApiFieldErrors, clearServerFieldErrors } from '../../../../core/http/api-error.util';
import { GuestApiService } from '../../services/guest-api.service';
import { GUESTS_DICTIONARY } from '../../guests.dictionary';

@Component({
  selector: 'app-guest-list',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    Button,
    IconField,
    InputIcon,
    InputText,
    Menu,
    TableModule,
    Drawer,
    SelectButton,
    GuestFormComponent,
    Paginator,
    EmptyStateComponent,
    PageHeaderComponent,
    TranslatePipe,
    CanDirective,
  ],
  templateUrl: './guest-list.component.html',
  styleUrl: './guest-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestListComponent {
  private readonly guestsApi = inject(GuestApiService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmService);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly statusOptions = computed(() => {
    this.i18n.currentLang();
    return [
      { label: this.i18n.t('guests.filter.active'), value: 'active' },
      { label: this.i18n.t('guests.filter.inactive'), value: 'inactive' },
      { label: this.i18n.t('guests.filter.all'), value: 'all' },
    ];
  });

  readonly rows = signal<Guest[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  private readonly search$ = new Subject<string>();
  readonly hasFilters = computed(() => !!this.search().trim() || this.status() !== 'active');
  readonly menuItems = signal<MenuItem[]>([]);
  readonly status = signal('active');

  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly canCreate = computed(() => this.auth.can('guests.create'));

  // Create/edit drawer
  readonly createVisible = signal(false);
  readonly editVisible = signal(false);
  readonly editTarget = signal<Guest | null>(null);
  readonly saving = signal(false);

  // View drawer
  readonly viewVisible = signal(false);
  readonly viewTarget = signal<Guest | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.maxLength(40)]],
    cnic: ['', [Validators.required, Validators.maxLength(40)]],
    address: ['', [Validators.maxLength(500)]],
    country: [DEFAULT_COUNTRY, [Validators.maxLength(80)]],
    state: ['', [Validators.maxLength(80)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  constructor() {
    this.i18n.register(GUESTS_DICTIONARY);
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => this.applySearch());
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.guestsApi
      .listPaginated({ q: this.search() || undefined, status: this.status() }, this.page(), this.pageSize())
      .subscribe({
        next: ({ items, pagination }) => {
          this.rows.set(items);
          this.totalRecords.set(pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.search$.next(value.trim());
  }

  clearFilters(): void {
    this.search.set('');
    this.status.set('active');
    this.page.set(1);
    this.reload();
  }

  initials(g: Guest): string {
    const parts = (g.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
  }

  /** The "…" menu: the less common actions, so each row stays calm. */
  prepareActions(event: Event, row: Guest, menu: { toggle: (e: Event) => void }): void {
    const items: MenuItem[] = [];
    if (this.auth.can('guests.detail')) items.push({ label: this.i18n.t('common.view'), icon: 'pi pi-eye', command: () => this.openView(row) });
    if (this.auth.can('guests.delete')) {
      items.push(
        row.deletedAt
          ? { label: this.i18n.t('common.restore'), icon: 'pi pi-refresh', command: () => this.onRestore(row) }
          : { label: this.i18n.t('guests.deactivate'), icon: 'pi pi-ban', command: () => this.onDelete(row) },
      );
    }
    this.menuItems.set(items);
    menu.toggle(event);
  }

  applySearch(): void {
    this.page.set(1);
    this.reload();
  }

  onStatusChange(value: string | null): void {
    if (!value) return;
    this.status.set(value);
    this.page.set(1);
    this.reload();
  }

  onPaginatorChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    this.page.set(Math.floor(first / rows) + 1);
    this.pageSize.set(rows);
    this.reload();
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({ fullName: '', email: '', phone: '', cnic: '', address: '', country: DEFAULT_COUNTRY, state: '', notes: '' });
    this.createVisible.set(true);
  }

  openEdit(row: Guest): void {
    this.editTarget.set(row);
    this.form.reset({
      fullName: row.fullName,
      email: row.email ?? '',
      phone: row.phone ?? '',
      cnic: row.cnic ?? '',
      address: row.address ?? '',
      country: row.country ?? '',
      state: row.state ?? '',
      notes: row.notes ?? '',
    });
    this.editVisible.set(true);
  }

  openView(row: Guest): void {
    this.viewTarget.set(row);
    this.viewVisible.set(true);
  }

  editFromView(): void {
    const row = this.viewTarget();
    if (!row) return;
    this.viewVisible.set(false);
    this.openEdit(row);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      fullName: v.fullName,
      email: v.email || undefined,
      phone: v.phone || undefined,
      cnic: v.cnic.trim(),
      address: v.address || undefined,
      country: v.country || undefined,
      state: v.state?.trim() || undefined,
      notes: v.notes || undefined,
    };
    const target = this.editTarget();
    clearServerFieldErrors(this.form);
    this.saving.set(true);
    const req = target ? this.guestsApi.update(guestRowId(target), payload) : this.guestsApi.create(payload);
    req.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: target ? this.i18n.t('guests.toast.updated') : this.i18n.t('guests.toast.created'),
          detail: payload.fullName,
        });
        this.createVisible.set(false);
        this.editVisible.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        applyApiFieldErrors(this.form, err);
      },
      complete: () => this.saving.set(false),
    });
  }

  onDelete(row: Guest): void {
    this.confirmation.confirm({
      message: this.i18n.t('guests.confirmDeactivateMessage', { name: row.fullName }),
      header: this.i18n.t('guests.confirmDeactivateHeader'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.guestsApi.delete(guestRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('guests.toast.deactivated'), detail: row.fullName });
            this.reload();
          },
          error: () => undefined,
        });
      },
    });
  }

  onRestore(row: Guest): void {
    this.guestsApi.restore(guestRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('guests.toast.restored'), detail: row.fullName });
        this.reload();
      },
      error: () => undefined,
    });
  }
}
