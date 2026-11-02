import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Image } from 'primeng/image';
import { Skeleton } from 'primeng/skeleton';
import { AnnouncementsApiService } from '../../features/announcements/services/announcements-api.service';

/**
 * Shows an announcement image. The image endpoint needs the bearer token, which a plain <img src>
 * can't send, so the bytes are fetched as a blob and shown through an object URL (revoked on destroy).
 * Click to enlarge.
 */
@Component({
  selector: 'app-secure-image',
  imports: [Image, Skeleton],
  template: `
    @if (src(); as url) {
      <p-image [src]="url" [alt]="alt()" [preview]="true" [imageClass]="'secure-image__img'" [style]="{ display: 'block' }" />
    } @else if (failed()) {
      <div class="secure-image__fallback"><i class="pi pi-image"></i></div>
    } @else {
      <p-skeleton width="100%" height="100%" />
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host ::ng-deep .secure-image__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    :host ::ng-deep p-image,
    :host ::ng-deep .p-image {
      display: block;
      width: 100%;
      height: 100%;
    }
    .secure-image__fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 4rem;
      color: var(--p-text-muted-color);
      background: var(--p-content-hover-background);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecureImageComponent {
  private readonly api = inject(AnnouncementsApiService);

  readonly announcementId = input.required<string>();
  readonly imageId = input.required<string>();
  readonly alt = input('');

  readonly src = signal<string | null>(null);
  readonly failed = signal(false);
  private objectUrl: string | null = null;

  constructor() {
    effect((onCleanup) => {
      const sub = this.api.imageBlob(this.announcementId(), this.imageId()).subscribe({
        next: (blob) => {
          this.release();
          this.objectUrl = URL.createObjectURL(blob);
          this.src.set(this.objectUrl);
          this.failed.set(false);
        },
        error: () => this.failed.set(true),
      });
      onCleanup(() => sub.unsubscribe());
    });
    inject(DestroyRef).onDestroy(() => this.release());
  }

  private release(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }
}
