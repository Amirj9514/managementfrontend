import { DatePipe, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Drawer } from 'primeng/drawer';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { Select } from 'primeng/select';
import { Ripple } from 'primeng/ripple';

import { BuildingListRow } from '../../../../core/models/building-admin.model';
import {
  FloorCreateRequest,
  FloorListRow,
  FloorUpdateRequest,
  floorRowId,
} from '../../../../core/models/floor-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { TableSkeletonComponent } from '../../../../shared/table-skeleton/table-skeleton.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { PROPERTY_DICTIONARY } from '../../property.dictionary';
import { BuildingsApiService } from '../../services/buildings-api.service';
import { FloorsApiService } from '../../services/floors-api.service';

@Component({
  selector: 'app-floor-list',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Card,
    PageHeaderComponent,
    EmptyStateComponent,
    Toolbar,
    Button,
    Fluid,
    InputText,
    ConfirmDialog,
    Drawer,
    Tag,
    Menu,
    NgIcon,
    Ripple,
    Select,
    TableSkeletonComponent,
    FieldErrorComponent,
    TranslatePipe,
  ],
  templateUrl: './floor-list.component.html',
  styleUrl: './floor-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloorListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  readonly i18n = inject(TranslationService);

  readonly buildingId = signal<string | null>(null);
  readonly building = signal<BuildingListRow | null>(null);
  readonly floors = signal<FloorListRow[]>([]);
  readonly loading = signal(true);
  readonly status = signal<string>('active');

  readonly createVisible = signal(false);
  readonly editVisible = signal(false);
  readonly editTarget = signal<FloorListRow | null>(null);
  readonly saving = signal(false);

  readonly menuItems = signal<MenuItem[]>([]);

  readonly floorForm = this.fb.group({
    label: ['', Validators.required],
  });

  readonly statusFilterOptions = computed(() => {
    this.i18n.currentLang();
    return [
      { label: this.i18n.t('property.filter.active'), value: 'active' },
      { label: this.i18n.t('property.filter.inactive'), value: 'inactive' },
      { label: this.i18n.t('property.filter.all'), value: 'all' },
    ];
  });

  constructor() {
    this.i18n.register(PROPERTY_DICTIONARY);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('buildingId');
    if (id) {
      this.buildingId.set(id);
      this.loadBuilding(id);
      this.loadFloors(id);
    } else {
      this.router.navigate(['/property/buildings']);
    }
  }

  loadBuilding(id: string): void {
    this.buildingsApi.getById(id).subscribe({
      next: (res) => this.building.set(res),
      error: () =>
        this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail: this.i18n.t('property.couldNotLoadBuilding') }),
    });
  }

  loadFloors(id: string): void {
    this.loading.set(true);
    this.floorsApi.list(id, 1, 100, this.status()).subscribe({
      next: ({ items }) => {
        this.floors.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusChange(value: any): void {
    this.status.set(value);
    const id = this.buildingId();
    if (id) this.loadFloors(id);
  }

  openCreate(): void {
    this.floorForm.reset({ label: '' });
    this.createVisible.set(true);
  }

  submitCreate(): void {
    const bId = this.buildingId();
    if (!bId || this.floorForm.invalid) {
      if (this.floorForm.invalid) this.floorForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const body: FloorCreateRequest = {
      buildingId: bId,
      label: this.floorForm.getRawValue().label!,
    };

    this.floorsApi.create(body).subscribe({
      next: (res) => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('property.floorAdded'), detail: res.label });
        this.createVisible.set(false);
        this.loadFloors(bId);
      },
      complete: () => this.saving.set(false),
    });
  }

  openEdit(row: FloorListRow): void {
    this.editTarget.set(row);
    this.floorForm.reset({ label: row.label });
    this.editVisible.set(true);
  }

  submitEdit(): void {
    const row = this.editTarget();
    const bId = this.buildingId();
    if (!row || !bId || this.floorForm.invalid) {
      if (this.floorForm.invalid) this.floorForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const body: FloorUpdateRequest = {
      label: this.floorForm.getRawValue().label!,
    };

    this.floorsApi.update(floorRowId(row), body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.updated'), detail: this.i18n.t('property.floorUpdated') });
        this.editVisible.set(false);
        this.loadFloors(bId);
      },
      complete: () => this.saving.set(false),
    });
  }

  onDelete(row: FloorListRow): void {
    this.confirmation.confirm({
      message: this.i18n.t('property.confirmDeactivateFloor', { label: row.label }),
      header: this.i18n.t('property.confirmDeactivationHeader'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.floorsApi.delete(floorRowId(row)).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: this.i18n.t('common.deactivated'), detail: this.i18n.t('property.floorMarkedInactive') });
            this.loadFloors(this.buildingId()!);
          },
        });
      },
    });
  }

  onRestore(row: FloorListRow): void {
    this.floorsApi.restore(floorRowId(row)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.t('common.restored'), detail: this.i18n.t('property.floorActiveAgain') });
        this.loadFloors(this.buildingId()!);
      },
    });
  }

  prepareActions(event: Event, row: FloorListRow, menu: any): void {
    const items: MenuItem[] = [
      {
        label: this.i18n.t('property.menu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.openEdit(row),
      },
    ];

    if (row.deletedAt || row.status === 'inactive') {
      items.push({
        label: this.i18n.t('property.menu.restore'),
        icon: 'pi pi-refresh',
        command: () => this.onRestore(row),
      });
    } else {
      items.push({
        label: this.i18n.t('property.menu.deactivate'),
        icon: 'pi pi-trash',
        command: () => this.onDelete(row),
      });
    }

    this.menuItems.set(items);
    menu.toggle(event);
  }

  goBack(): void {
    this.router.navigate(['/branches']);
  }
}
