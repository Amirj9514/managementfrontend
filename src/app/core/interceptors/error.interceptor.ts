import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { SKIP_ERROR_TOAST } from '../http/skip-error-toast';
import { getApiErrorMessage, isApiErrorBody } from '../http/api-error.util';
import { TranslationService } from '../i18n/translation.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(MessageService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const i18n = inject(TranslationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const skipToast =
        req.context.get(SKIP_ERROR_TOAST) ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register');

      if (err.status === 401) {
        if (!req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
          auth.clearSession();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.url === '/login' ? undefined : router.url },
          });
        }
      } else if (err.status === 403) {
        if (!skipToast) {
          const detail = getApiErrorMessage(err, i18n.t('common.accessDeniedDetail'));
          messages.add({
            severity: 'warn',
            summary: i18n.t('common.accessDenied'),
            detail,
          });
        }
        void router.navigate(['/forbidden']);
      } else if (!skipToast) {
        const body = err.error;
        let detail = getApiErrorMessage(err, i18n.t('common.requestFailed'));
        if (!isApiErrorBody(body) && typeof body === 'object' && body && 'message' in body) {
          detail = String((body as { message: unknown }).message);
        }
        messages.add({
          severity: 'error',
          summary: i18n.t('common.error'),
          detail,
        });
      }
      return throwError(() => err);
    }),
  );
};
