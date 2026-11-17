import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators, type ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Subject, forkJoin, map, of, switchMap, type Observable } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { buildingRowId } from '../../../../core/models/building-admin.model';
import { floorRowId } from '../../../../core/models/floor-admin.model';
import { hasFullAccess, type PermissionCatalog } from '../../../../core/models/permissions.model';
import { STAFF_ROLE_OPTIONS, isFloorScopedRole } from '../../../../core/models/roles.model';
import type { UserCreateRequest } from '../../../../core/models/user-admin.model';
import { AuthService } from '../../../../core/services/auth.service';
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

/** Icon shown on each role card. */
const ROLE_ICONS: Record<string, string> = {
  super_admin: 'pi-shield',
  admin: 'pi-key',
  branch_admin: 'pi-building',
  building_admin: 'pi-home',
  booking_admin: 'pi-calendar',
  employee_admin: 'pi-briefcase',
  front_desk: 'pi-desktop',
  housekeeping: 'pi-sparkles',
  staff: 'pi-user',
};

/** Non-admin roles need at least one branch, otherwise the user could not reach anything. */
function scopeValidator(group: AbstractControl): ValidationErrors | null {
  const role = group.get('role')?.value as string | null;
  const branchIds = (group.get('branchIds')?.value as string[] | null) ?? [];
  return !hasFullAccess(role) && branchIds.length === 0 ? { branchRequired: true } : null;
}

/** A readable 12-character password with upper/lower case, digits and a symbol (no look-alike letters). */
function generatePassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const rnd = (max: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  };
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < 12) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Full-page "new user" screen: account details, role + access scope (branches, buildings, floors) and the
 * per-screen permission grid, saved together in one request. A live summary on the side shows exactly what
 * is about to be created, and "Create and add another" keeps the role and branch for the next person.
 */
@Component({
  selector: 'app-user-create',
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
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
  private readonly auth = inject(AuthService);
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
      role: ['front_desk', Validators.required],
      branchIds: [[] as string[]],
      buildingIds: [[] as string[]],
      floorIds: [[] as string[]],
    },
    { validators: [scopeValidator] },
  );

  readonly catalog = signal<PermissionCatalog | null>(null);
  readonly permissions = signal<string[]>([]);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);
  readonly copied = signal(false);

  readonly branchOptions = signal<Option[]>([]);
  readonly buildingOptions = signal<Option[]>([]);
  readonly floorOptions = signal<Option[]>([]);
  readonly loadingBuildings = signal(false);
  readonly loadingFloors = signal(false);

  /** Mirrors of form values so the summary and password meter re-render (OnPush-safe). */
  readonly role = signal<string>('front_desk');
  readonly nameValue = signal('');
  readonly emailValue = signal('');
  readonly passwordValue = signal('');
  readonly branchCount = signal(0);
  readonly buildingCount = signal(0);
  readonly selectedBuildings = signal<string[]>([]);
  readonly floorCount = signal(0);

  readonly fullAccess = computed(() => hasFullAccess(this.role()));
  readonly floorScoped = computed(() => isFloorScopedRole(this.role()));

  /** Only a super admin can create admins; everyone else here can create the staff roles. */
  private readonly canCreateAdmins = this.auth.hasAnyRole(['super_admin']);

  readonly roleCards = computed(() => {
    this.i18n.currentLang();
    return STAFF_ROLE_OPTIONS.filter((o) => this.canCreateAdmins || !hasFullAccess(o.value)).map((o) => ({
      value: o.value as string,
      icon: ROLE_ICONS[o.value] ?? 'pi-user',
      label: this.i18n.t('role.' + o.value),
      hint: this.i18n.t('users.roleHint.' + o.value),
    }));
  });
  readonly roleLabel = computed(() => {
    this.i18n.currentLang();
    return this.i18n.t('role.' + this.role());
  });

  /** Blocks as cards: "Branch › Block" option labels split into a title and a sub-line. */
  readonly buildingCards = computed(() =>
    this.buildingOptions().map((o) => {
      const i = o.label.lastIndexOf(' › ');
      return { value: o.value, name: i >= 0 ? o.label.slice(i + 3) : o.label, branch: i >= 0 ? o.label.slice(0, i) : '' };
    }),
  );

  readonly totalPermissions = computed(() => this.catalog()?.modules.reduce((n, m) => n + m.actions.length, 0) ?? 0);

  /** 0–4: length, mixed case, digit, symbol. */
  readonly strength = computed(() => {
    const p = this.passwordValue();
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p) && p.length >= 8) score++;
    return p.length < 8 ? Math.min(score, 1) : score;
  });
  readonly strengthKey = computed(() => ['', 'users.pw.weak', 'users.pw.fair', 'users.pw.good', 'users.pw.strong'][this.strength()] || 'users.pw.weak');

  /** What is still missing before "Create" can succeed. */
  readonly checklist = computed(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailValue().trim());
    const items = [
      { key: 'users.check.email', ok: emailOk },
      { key: 'users.check.password', ok: this.passwordValue().length >= 8 },
    ];
    if (!this.fullAccess()) items.push({ key: 'users.check.branch', ok: this.branchCount() > 0 });
    return items;
  });
  readonly ready = computed(() => this.checklist().every((c) => c.ok));

  readonly displayName = computed(() => this.nameValue().trim() || this.emailValue().trim() || this.i18n.t('users.summary.newPerson'));
  readonly initials = computed(() => {
    const base = this.nameValue().trim() || this.emailValue().trim();
    const parts = base.split(/[\s@.]+/).filter(Boolean);
    return base ? ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase() : '?';
  });

  private readonly floorRefresh$ = new Subject<void>();

  constructor() {
    this.i18n.register(USERS_DICTIONARY);

    const f = this.form.controls;
    f.name.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.nameValue.set(v ?? ''));
    f.email.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.emailValue.set(v ?? ''));
    f.password.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      this.passwordValue.set(v ?? '');
      this.copied.set(false);
    });
    f.branchIds.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.branchCount.set(v?.length ?? 0));
    f.buildingIds.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      this.buildingCount.set(v?.length ?? 0);
      this.selectedBuildings.set(v ?? []);
    });
    f.floorIds.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.floorCount.set(v?.length ?? 0));

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
        if (items.length === 1) f.branchIds.setValue([items[0]._id]);
      },
    });

    // Role → starting permissions, and clear access scope for roles that don't use it.
    f.role.valueChanges.pipe(takeUntilDestroyed()).subscribe((role) => {
      this.role.set(role ?? '');
      this.permissions.set(this.defaultsFor(role));
      if (hasFullAccess(role)) this.form.patchValue({ branchIds: [], buildingIds: [], floorIds: [] });
      this.floorRefresh$.next();
    });

    // Branches → the buildings inside them.
    f.branchIds.valueChanges
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
        this.keepOnly(f.buildingIds, options);
        this.floorRefresh$.next();
      });

    // Buildings (or the chosen subset of them) → the floors inside them.
    f.buildingIds.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.floorRefresh$.next());

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
        this.keepOnly(f.floorIds, options);
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
          map(({ items }) => items.map((fl) => ({ label: `${b.label} › ${fl.label}`, value: floorRowId(fl) }))),
        ),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  // --- password helpers
  generate(): void {
    this.form.controls.password.setValue(generatePassword());
    this.form.controls.password.markAsDirty();
    this.showPassword.set(true);
  }

  async copyPassword(): Promise<void> {
    const pw = this.form.controls.password.value;
    if (!pw) return;
    try {
      await navigator.clipboard.writeText(pw);
      this.copied.set(true);
    } catch {
      // Clipboard blocked (e.g. http): reveal the password so it can be copied by hand.
      this.showPassword.set(true);
    }
  }

  toggleBuilding(value: string): void {
    const ctrl = this.form.controls.buildingIds;
    const cur = ctrl.value ?? [];
    ctrl.setValue(cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
    ctrl.markAsDirty();
  }

  clearBuildings(): void {
    this.form.controls.buildingIds.setValue([]);
  }

  pickRole(value: string): void {
    this.form.controls.role.setValue(value);
  }

  showError(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  get branchMissing(): boolean {
    return this.form.hasError('branchRequired') && this.submitted();
  }

  cancel(): void {
    void this.router.navigate(['/users']);
  }

  submit(addAnother = false): void {
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
        this.messages.add({ severity: 'success', summary: this.i18n.t('users.toast.userCreated'), detail: body.email });
        this.saving.set(false);
        if (addAnother) {
          // Keep role, branch and permissions: onboarding several people with the same job is the common case.
          this.form.patchValue({ name: '', email: '', password: '' });
          this.form.controls.email.markAsUntouched();
          this.form.controls.password.markAsUntouched();
          this.submitted.set(false);
          this.showPassword.set(false);
          document.querySelector('.app-shell__main')?.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          void this.router.navigate(['/users']);
        }
      },
      // The error toast already says why (e.g. email already in use); stay on the form to fix it.
      error: () => this.saving.set(false),
    });
  }
}
