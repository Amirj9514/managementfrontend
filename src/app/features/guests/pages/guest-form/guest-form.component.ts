import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { GuestApiService } from '../../services/guest-api.service';

@Component({
  selector: 'app-guest-form',
  imports: [ReactiveFormsModule, Button, Card, Fluid, InputText, PageHeaderComponent],
  templateUrl: './guest-form.component.html',
  styleUrl: './guest-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly guestsApi = inject(GuestApiService);
  private readonly messages = inject(MessageService);

  readonly isCreate = signal(true);
  readonly loading = signal(false);
  private guestId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [''],
    phone: [''],
    nationality: [''],
    passportNumber: [''],
    branchId: [''],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.route.snapshot.url.map((s) => s.path);
    const isEdit = url.includes('edit');
    if (isEdit && id) {
      this.isCreate.set(false);
      this.guestId = id;
      this.loading.set(true);
      this.guestsApi.getById(id).subscribe({
        next: (g) => {
          this.form.patchValue({
            firstName: g.firstName,
            lastName: g.lastName,
            email: g.email ?? '',
            phone: g.phone ?? '',
            nationality: g.nationality ?? '',
            passportNumber: g.passportNumber ?? '',
            branchId: g.branchId ?? '',
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  cancel(): void {
    void this.router.navigate(['/guests']);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email || undefined,
      phone: v.phone || undefined,
      nationality: v.nationality || undefined,
      passportNumber: v.passportNumber || undefined,
      branchId: v.branchId || undefined,
    };
    if (this.isCreate()) {
      this.guestsApi.create(payload).subscribe({
        next: (g) => {
          this.messages.add({ severity: 'success', summary: 'Created', detail: 'Guest saved.' });
          void this.router.navigate(['/guests', g.id]);
        },
      });
    } else if (this.guestId) {
      this.guestsApi.update(this.guestId, payload).subscribe({
        next: (g) => {
          this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Guest saved.' });
          void this.router.navigate(['/guests', g.id]);
        },
      });
    }
  }
}
