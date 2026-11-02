import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { startWith, switchMap, of, catchError, EMPTY } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';
import {
  ANNOUNCEMENT_LIMITS,
  type AnnouncementImage,
  type AnnouncementPriority,
  type AnnouncementWriteRequest,
} from '../../../../core/models/announcement.model';
import { STAFF_ROLE_OPTIONS, USER_ROLES } from '../../../../core/models/roles.model';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { SecureImageComponent } from '../../../../shared/secure-image/secure-image.component';
import { ANNOUNCEMENTS_DICTIONARY } from '../../announcements.dictionary';
import { AnnouncementsApiService } from '../../services/announcements-api.service';

interface PendingImage {
  file: File;
  url: string;
}

function rolesRequired(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length > 0 ? null : { rolesRequired: true };
}

/** Expiry must come after the publish moment (now, when "publish immediately" is on). */
function expiryAfterPublish(group: AbstractControl): ValidationErrors | null {
  const expires = group.get('expiresAt')?.value as Date | null;
  if (!expires) return null;
  const publishNow = group.get('publishNow')?.value as boolean;
  const publishAt = group.get('publishAt')?.value as Date | null;
  const start = publishNow || !publishAt ? new Date() : publishAt;
  return expires.getTime() <= start.getTime() ? { expiryBeforePublish: true } : null;
}

/** Full-page create / edit form: message, audience, schedule, images, with a live preview. */
@Component({
  selector: 'app-announcement-form',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    Button,
    InputText,
    Textarea,
    SelectButton,
    ToggleSwitch,
    DatePicker,
    Skeleton,
    Tag,
    PageHeaderComponent,
    SecureImageComponent,
    TranslatePipe,
  ],
  templateUrl: './announcement-form.component.html',
  styleUrl: './announcement-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AnnouncementsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  readonly i18n = inject(TranslationService);

  readonly limits = ANNOUNCEMENT_LIMITS;
  readonly today = new Date();
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.id;

  readonly form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.maxLength(ANNOUNCEMENT_LIMITS.titleMax)]],
      body: ['', [Validators.required, Validators.maxLength(ANNOUNCEMENT_LIMITS.bodyMax)]],
      priority: ['normal' as AnnouncementPriority],
      roles: [[] as string[], rolesRequired],
      publishNow: [true],
      publishAt: [null as Date | null],
      expiresAt: [null as Date | null],
    },
    { validators: expiryAfterPublish },
  );
  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly existingImages = signal<AnnouncementImage[]>([]);
  readonly pendingImages = signal<PendingImage[]>([]);
  readonly imageErrors = signal<string[]>([]);
  readonly dragging = signal(false);

  readonly roleOptions = computed(() => {
    this.i18n.currentLang();
    return STAFF_ROLE_OPTIONS.map((o) => ({ ...o, label: this.i18n.t('role.' + o.value) }));
  });
  readonly priorityOptions = computed(() => {
    this.i18n.currentLang();
    return (['normal', 'important'] as AnnouncementPriority[]).map((p) => ({
      value: p,
      label: this.i18n.t('announcements.form.priority.' + p),
    }));
  });
  readonly selectedRoleCount = computed(() => (this.formValue().roles ?? []).length);
  readonly hasPendingImages = computed(() => this.pendingImages().length > 0);
  readonly imageCount = computed(() => this.existingImages().length + this.pendingImages().length);
  readonly bodyLength = computed(() => (this.formValue().body ?? '').length);
  readonly preview = computed(() => {
    const v = this.formValue();
    return {
      title: (v.title ?? '').trim(),
      body: (v.body ?? '').trim(),
      important: v.priority === 'important',
      roles: (v.roles ?? []) as string[],
    };
  });
  readonly showPublishAt = computed(() => this.isEdit || !this.formValue().publishNow);

  constructor() {
    this.i18n.register(ANNOUNCEMENTS_DICTIONARY);

    // "Publish immediately" off → a date is required; on → it is cleared.
    this.form.controls.publishNow.valueChanges.pipe(takeUntilDestroyed()).subscribe((now) => {
      if (now) this.form.controls.publishAt.setValue(null);
    });

    if (this.id) {
      this.api.get(this.id).subscribe({
        next: (a) => {
          this.form.patchValue({
            title: a.title,
            body: a.body,
            priority: a.priority,
            roles: a.roles,
            publishNow: false,
            publishAt: new Date(a.publishAt),
            expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
          });
          this.existingImages.set(a.images);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          void this.router.navigate(['/announcements/manage']);
        },
      });
    }

    inject(DestroyRef).onDestroy(() => this.pendingImages().forEach((p) => URL.revokeObjectURL(p.url)));
  }

  // ---- audience helpers

  isRoleOn(role: string): boolean {
    return (this.formValue().roles ?? []).includes(role);
  }

  toggleRole(role: string): void {
    const control = this.form.controls.roles;
    const current = control.value ?? [];
    control.setValue(current.includes(role) ? current.filter((r) => r !== role) : [...current, role]);
    control.markAsTouched();
  }

  selectAllRoles(): void {
    this.form.controls.roles.setValue([...USER_ROLES]);
  }

  clearRoles(): void {
    this.form.controls.roles.setValue([]);
  }

  get rolesInvalid(): boolean {
    const c = this.form.controls.roles;
    return c.invalid && (c.touched || this.submitted());
  }

  fieldInvalid(name: 'title' | 'body'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  get expiryInvalid(): boolean {
    return this.form.hasError('expiryBeforePublish');
  }

  // ---- images

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = ''; // allow picking the same file again after removing it
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  /** Validates each file (type, size, total count) and queues the good ones for upload on save. */
  private addFiles(files: File[]): void {
    const errors: string[] = [];
    const accepted: PendingImage[] = [];
    for (const file of files) {
      if (this.imageCount() + accepted.length >= ANNOUNCEMENT_LIMITS.maxImages) {
        errors.push(this.i18n.t('announcements.form.tooMany', { max: ANNOUNCEMENT_LIMITS.maxImages }));
        break;
      }
      const okType = (ANNOUNCEMENT_LIMITS.imageTypes as readonly string[]).includes(file.type);
      if (!okType || file.size > ANNOUNCEMENT_LIMITS.imageMaxBytes) {
        errors.push(this.i18n.t('announcements.form.badImage', { name: file.name }));
        continue;
      }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }
    this.pendingImages.update((list) => [...list, ...accepted]);
    this.imageErrors.set(errors);
  }

  removePending(index: number): void {
    const item = this.pendingImages()[index];
    if (item) URL.revokeObjectURL(item.url);
    this.pendingImages.update((list) => list.filter((_, i) => i !== index));
  }

  removeExisting(image: AnnouncementImage): void {
    if (!this.id) return;
    this.api.deleteImage(this.id, image._id).subscribe({
      next: (a) => this.existingImages.set(a.images),
    });
  }

  // ---- save

  cancel(): void {
    void this.router.navigate(['/announcements/manage']);
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: AnnouncementWriteRequest = {
      title: v.title!.trim(),
      body: v.body!.trim(),
      roles: v.roles ?? [],
      priority: v.priority ?? 'normal',
      expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null,
    };
    if (this.isEdit) {
      body.publishAt = v.publishAt ? v.publishAt.toISOString() : undefined;
    } else {
      body.publishAt = v.publishNow || !v.publishAt ? null : v.publishAt.toISOString();
    }

    this.saving.set(true);
    const save$ = this.isEdit ? this.api.update(this.id!, body) : this.api.create(body);
    save$
      .pipe(
        switchMap((saved) => {
          const files = this.pendingImages().map((p) => p.file);
          if (!files.length) return of({ id: saved._id, imagesFailed: false });
          return this.api.uploadImages(saved._id, files).pipe(
            switchMap(() => of({ id: saved._id, imagesFailed: false })),
            // The text is already saved — keep it and let the admin retry the pictures.
            catchError(() => of({ id: saved._id, imagesFailed: true })),
          );
        }),
        catchError(() => {
          this.saving.set(false);
          return EMPTY;
        }),
      )
      .subscribe(({ id, imagesFailed }) => {
        this.saving.set(false);
        if (imagesFailed) {
          this.messages.add({ severity: 'warn', summary: this.i18n.t('announcements.toast.imagesFailed') });
          if (this.isEdit) {
            // Stay here: show what did get attached and let the admin retry the rest.
            this.pendingImages().forEach((p) => URL.revokeObjectURL(p.url));
            this.pendingImages.set([]);
            this.api.get(id).subscribe({ next: (a) => this.existingImages.set(a.images) });
          } else {
            void this.router.navigate(['/announcements', id, 'edit']);
          }
          return;
        }
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t(this.isEdit ? 'announcements.toast.updated' : 'announcements.toast.created'),
        });
        void this.router.navigate(['/announcements/manage']);
      });
  }
}
