import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { ToggleSwitch } from 'primeng/toggleswitch';
import type { AmenityRow } from '../../../../core/models/unit-admin.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { AmenitiesApiService } from '../../services/amenities-api.service';

@Component({
  selector: 'app-amenity-list',
  imports: [
    ReactiveFormsModule,
    TableModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    Toolbar,
    Button,
    Fluid,
    InputText,
    Dialog,
    Tag,
    ToggleSwitch,
    ConfirmDialog,
    FieldErrorComponent,
  ],
  templateUrl: './amenity-list.component.html',
  styleUrl: './amenity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmenityListComponent {
  private readonly api = inject(AmenitiesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<AmenityRow[]>([]);
  readonly loading = signal(true);

  readonly formVisible = signal(false);
  readonly editTarget = signal<AmenityRow | null>(null);
  readonly saving = signal(false);
  readonly isEdit = computed(() => this.editTarget() !== null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    icon: [''],
    category: [''],
    active: [true],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: ({ items }) => {
        this.rows.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({ name: '', icon: '', category: '', active: true });
    this.formVisible.set(true);
  }

  openEdit(row: AmenityRow): void {
    this.editTarget.set(row);
    this.form.reset({
      name: row.name,
      icon: row.icon ?? '',
      category: row.category ?? '',
      active: row.active,
    });
    this.formVisible.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = this.form.getRawValue();
    this.saving.set(true);
    const target = this.editTarget();
    const req = target ? this.api.update(target._id, body) : this.api.create(body);
    req.subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: target ? 'Updated' : 'Created', detail: body.name ?? '' });
        this.formVisible.set(false);
        this.reload();
      },
      error: (err) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Save failed' });
      },
      complete: () => this.saving.set(false),
    });
  }

  remove(row: AmenityRow): void {
    this.confirmation.confirm({
      message: `Remove amenity "${row.name}"?`,
      header: 'Confirm removal',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(row._id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Removed', detail: row.name });
            this.reload();
          },
          error: (err) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err.message || 'Removal failed' });
          },
        });
      },
    });
  }
}
