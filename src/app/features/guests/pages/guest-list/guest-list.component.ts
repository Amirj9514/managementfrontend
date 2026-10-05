import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { Drawer } from 'primeng/drawer';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { Paginator } from 'primeng/paginator';
import type { PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { CountryStateFieldsComponent } from '../../../../shared/country-state-fields/country-state-fields.component';
import { DEFAULT_COUNTRY } from '../../../../core/data/countries';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import { Toolbar } from 'primeng/toolbar';
import { GUEST_DELETE_ROLES, GUEST_WRITE_ROLES } from '../../../../core/models/roles.model';
import { guestRowId, type Guest } from '../../../../core/models/guest.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
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
    Card,
    InputText,
    TableModule,
    Toolbar,
    Drawer,
    Fluid,
    DatePicker,
    Textarea,
    Select,
    CountryStateFieldsComponent,
    Tag,
    Paginator,
    ConfirmDialog,
    EmptyStateComponent,
    PageHeaderComponent,
    FieldErrorComponent,
    TranslatePipe,
  ],
  templateUrl: './guest-list.component.html',
  styleUrl: './guest-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestListComponent {
  private readonly guestsApi = inject(GuestApiService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly today = new Date();

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
  readonly status = signal('active');

  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly canWrite = signal(false);
  readonly canDelete = signal(false);

  // Create/edit drawer
  readonly createVisible = signal(false);
  readonly editVisible = signal(false);
  readonly editTarget = signal<Guest | null>(null);
  readonly saving = signal(false);

  // View drawer
  readonly viewVisible = signal(false);
  readonly viewTarget = signal<Guest | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: [''],
    phone: [''],
    cnic: [''],
    address: [''],
    country: [DEFAULT_COUNTRY],
    state: [''],
    dateOfBirth: [null as Date | null],
    notes: [''],
  });

  constructor() {
    this.i18n.register(GUESTS_DICTIONARY);
    const user = this.auth.getUser();
    this.canWrite.set(!!user && GUEST_WRITE_ROLES.includes(user.role));
    this.canDelete.set(!!user && GUEST_DELETE_ROLES.includes(user.role));
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

  private dobToDate(dob: string | null | undefined): Date | null {
    return dob ? new Date(dob) : null;
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({ fullName: '', email: '', phone: '', cnic: '', address: '', country: DEFAULT_COUNTRY, state: '', dateOfBirth: null, notes: '' });
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
      dateOfBirth: this.dobToDate(row.dateOfBirth),
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
      cnic: v.cnic || undefined,
      address: v.address || undefined,
      country: v.country || undefined,
      state: v.state?.trim() || undefined,
      dateOfBirth: v.dateOfBirth ? v.dateOfBirth.toISOString() : undefined,
      notes: v.notes || undefined,
    };
    const target = this.editTarget();
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
      error: (err) =>
        this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail: err.message || this.i18n.t('guests.toast.saveFailed') }),
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
          error: (err) =>
            this.messages.add({
              severity: 'error',
              summary: this.i18n.t('common.error'),
              detail: err.message || this.i18n.t('guests.toast.deactivationFailed'),
            }),
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
      error: (err) =>
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('common.error'),
          detail: err.message || this.i18n.t('guests.toast.restoreFailed'),
        }),
    });
  }
}
