import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import type { Employee } from '../../../../core/models/entity-stubs.model';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { EmployeesApiService } from '../../services/employees-api.service';
import { HR_DICTIONARY } from '../../hr.dictionary';

@Component({
  selector: 'app-employee-list',
  imports: [Card, TableModule, PageHeaderComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListComponent {
  private readonly api = inject(EmployeesApiService);
  private readonly i18n = inject(TranslationService);

  readonly rows = signal<Employee[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.i18n.register(HR_DICTIONARY);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
