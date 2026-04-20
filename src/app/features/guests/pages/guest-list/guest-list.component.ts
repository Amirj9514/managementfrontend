import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import { GUEST_DELETE_ROLES, GUEST_WRITE_ROLES } from '../../../../core/models/roles.model';
import type { Guest } from '../../../../core/models/guest.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { GuestApiService } from '../../services/guest-api.service';

@Component({
  selector: 'app-guest-list',
  imports: [
    FormsModule,
    NgIcon,
    Button,
    Card,
    InputText,
    TableModule,
    Toolbar,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './guest-list.component.html',
  styleUrl: './guest-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestListComponent {
  private readonly guestsApi = inject(GuestApiService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  readonly guests = signal<Guest[]>([]);
  readonly loading = signal(true);
  search = '';

  readonly canWrite = signal(false);
  readonly canDelete = signal(false);

  constructor() {
    const user = this.auth.getUser();
    this.canWrite.set(!!user && GUEST_WRITE_ROLES.includes(user.role));
    this.canDelete.set(!!user && GUEST_DELETE_ROLES.includes(user.role));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.guestsApi.list({ q: this.search || undefined }).subscribe({
      next: (rows) => {
        this.guests.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applySearch(): void {
    this.reload();
  }

  goNew(): void {
    void this.router.navigate(['/guests', 'new']);
  }

  goView(id: string): void {
    void this.router.navigate(['/guests', id]);
  }

  goEdit(id: string): void {
    void this.router.navigate(['/guests', id, 'edit']);
  }

  confirmDelete(guest: Guest): void {
    this.confirm.confirm({
      message: `Delete ${guest.firstName} ${guest.lastName}?`,
      header: 'Confirm',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.guestsApi.delete(guest.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Guest removed.' });
            this.reload();
          },
        });
      },
    });
  }
}
