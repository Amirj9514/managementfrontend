import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { Subject, forkJoin, map, of, switchMap, type Observable } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { buildingRowId } from '../../../../core/models/building-admin.model';
import { floorRowId } from '../../../../core/models/floor-admin.model';
import { hasFullAccess, type PermissionCatalog } from '../../../../core/models/permissions.model';
import { STAFF_ROLE_OPTIONS, isFloorScopedRole } from '../../../../core/models/roles.model';
import type { UserCreateRequest } from '../../../../core/models/user-admin.model';
import { PermissionsApiService } from '../../../../core/services/permissions-api.service';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { PermissionMatrixComponent } from '../../../../shared/permission-matrix/permission-matrix.component';
import { BranchesApiService } from '../../../branches/services/branches-api.service';
import { BuildingsApiService } from '../../../property/services/buildings-api.service';
import { FloorsApiService } from '../../../property/services/floors-api.service';
import { UsersApiService } from '../../services/users-api.service';
import { USERS_DICTIONARY } from '../../users.dictionary';

interface Option {
  label: string;
  value: string;
}

/** Non-admin roles need at least one branch, otherwise the user could not reach anything. */
function scopeValidator(group: AbstractControl): ValidationErrors | null {
  const role = group.get('role')?.value as string | null;
  const branchIds = (group.get('branchIds')?.value as string[] | null) ?? [];
  return !hasFullAccess(role) && branchIds.length === 0 ? { branchRequired: true } : null;
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value as string | null;
  const confirm = group.get('confirmPassword')?.value as string | null;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

/**
 * Full-page "new user" screen: account details, role + access scope (branches, buildings, floors),
 * and the per-screen permission grid, saved together in one request.
 */
@Component({
  selector: 'app-user-create',
  imports: [
    ReactiveFormsModule,
    Card,
    Button,
    InputText,
    Password,
    Select,
    MultiSelect,
    PageHeaderComponent,
    FieldErrorComponent,
    PermissionMatrixComponent,
    TranslatePipe,
  ],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly usersApi = inject(UsersApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly buildingsApi = inject(BuildingsApiService);
  private readonly floorsApi = inject(FloorsApiService);
  private readonly permissionsApi = inject(PermissionsApiService);
  readonly i18n = inject(TranslationService);

  readonly form = this.fb.group(
    {
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['front_desk', Validators.required],
      branchIds: [[] as string[]],
      buildingIds: [[] as string[]],
      floorIds: [[] as string[]],
    },
    { validators: [scopeValidator, passwordsMatch] },
  );

  readonly catalog = signal<PermissionCatalog | null>(null);
  readonly permissions = signal<string[]>([]);
  readonly saving = signal(false);
  readonly submitted = signal(false);

  readonly branchOptions = signal<Option[]>([]);
  readonly buildingOptions = signal<Option[]>([]);
  readonly floorOptions = signal<Option[]>([]);
  readonly loadingBuildings = signal(false);
  readonly loadingFloors = signal(false);

  /** Re-render hook: the role drives which sections show, and a plain form read isn't reactive. */
  readonly role = signal<string>('front_desk');
  readonly fullAccess = computed(() => hasFullAccess(this.role()));
  readonly floorScoped = computed(() => isFloorScopedRole(this.role()));

  readonly roleOptions = computed(() => {
    this.i18n.currentLang();
    return STAFF_ROLE_OPTIONS.map((o) => ({ ...o, label: this.i18n.t('role.' + o.value) }));
  });
  readonly roleHint = computed(() => {
    this.i18n.currentLang();
    const key = `users.roleHint.${this.role()}`;
    const text = this.i18n.t(key);
    return text === key ? '' : text;
  });

  private readonly floorRefresh$ = new Subject<void>();

  constructor() {
    this.i18n.register(USERS_DICTIONARY);

    this.permissionsApi.getCatalog().subscribe({
      next: (cat) => {
        this.catalog.set(cat);
        this.permissions.set(this.defaultsFor(this.role()));
      },
    });

    this.branchesApi.list(1, 100, 'active').subscribe({
      next: ({ items }) => {
        this.branchOptions.set(items.map((b) => ({ label: b.name, value: b._id })));
        // A single branch is the only sensible choice — preselect it.
        if (items.length === 1) this.form.controls.branchIds.setValue([items[0]._id]);
      },
    });

    // Role → starting permissions, and clear access scope for roles that don't use it.
    this.form.controls.role.valueChanges.pipe(takeUntilDestroyed()).subscribe((role) => {
      this.role.set(role ?? '');
      this.permissions.set(this.defaultsFor(role));
      if (hasFullAccess(role)) {
        this.form.patchValue({ branchIds: [], buildingIds: [], floorIds: [] });
      }
      this.floorRefresh$.next();
    });

    // Branches → the buildings inside them.
    this.form.controls.branchIds.valueChanges
      .pipe(
        switchMap((ids) => {
          this.loadingBuildings.set(true);
          return this.fetchBuildings(ids ?? []);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((options) => {
        this.loadingBuildings.set(false);
        this.buildingOptions.set(options);
        this.keepOnly(this.form.controls.buildingIds, options);
        this.floorRefresh$.next();
      });

    // Buildings (or the chosen subset of them) → the floors inside them.
    this.form.controls.buildingIds.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.floorRefresh$.next());

    this.floorRefresh$
      .pipe(
        switchMap(() => {
          if (!this.floorScoped()) return of([] as Option[]);
          this.loadingFloors.set(true);
          return this.fetchFloors();
        }),
        takeUntilDestroyed(),
      )
      .subscribe((options) => {
        this.loadingFloors.set(false);
        this.floorOptions.set(options);
        this.keepOnly(this.form.controls.floorIds, options);
      });
  }

  /** Drops selected values that are no longer offered (e.g. after unticking a branch). */
  private keepOnly(control: AbstractControl<string[] | null>, options: Option[]): void {
    const valid = new Set(options.map((o) => o.value));
    const current = control.value ?? [];
    const next = current.filter((v) => valid.has(v));
    if (next.length !== current.length) control.setValue(next);
  }

  private defaultsFor(role: string | null | undefined): string[] {
    return [...(this.catalog()?.roleDefaults[role ?? ''] ?? [])];
  }

  private fetchBuildings(branchIds: string[]): Observable<Option[]> {
    if (!branchIds.length) return of([]);
    const branchName = new Map(this.branchOptions().map((b) => [b.value, b.label]));
    return forkJoin(branchIds.map((id) => this.buildingsApi.list(1, 100, 'active', id))).pipe(
      map((pages) =>
        pages.flatMap((p) =>
          p.items.map((b) => ({
            label: `${branchName.get(b.branchId) ?? ''} › ${b.name}`.replace(/^ › /, ''),
            value: buildingRowId(b),
          })),
        ),
      ),
    );
  }

  /** Floors of the chosen buildings, or of every building in the chosen branches when none is chosen. */
  private fetchFloors(): Observable<Option[]> {
    const chosen = this.form.controls.buildingIds.value ?? [];
    const targets = chosen.length ? this.buildingOptions().filter((b) => chosen.includes(b.value)) : this.buildingOptions();
    if (!targets.length) return of([]);
    return forkJoin(
      targets.map((b) =>
        this.floorsApi.list(b.value, 1, 100, 'active').pipe(
          map(({ items }) => items.map((f) => ({ label: `${b.label} › ${f.label}`, value: floorRowId(f) }))),
        ),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  showError(name: 'email' | 'password' | 'confirmPassword'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  get mismatch(): boolean {
    return this.form.hasError('passwordMismatch') && (this.form.controls.confirmPassword.touched || this.submitted());
  }

  get branchMissing(): boolean {
    return this.form.hasError('branchRequired') && this.submitted();
  }

  cancel(): void {
    void this.router.navigate(['/users']);
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: UserCreateRequest = {
      email: v.email!.trim(),
      password: v.password!,
      name: (v.name ?? '').trim() || undefined,
      role: v.role!,
    };
    if (!hasFullAccess(v.role)) {
      body.permissions = this.permissions();
      body.assignment = {
        branchIds: v.branchIds ?? [],
        buildingIds: v.buildingIds ?? [],
        floorIds: isFloorScopedRole(v.role) ? (v.floorIds ?? []) : [],
      };
    }
    this.saving.set(true);
    this.usersApi.create(body).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('users.toast.userCreated'),
          detail: body.email,
        });
        void this.router.navigate(['/users']);
      },
      error: () => this.saving.set(false),
    });
  }
}
