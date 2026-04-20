import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import type { ApiErrorBody } from '../models/api.types';
import { AuthService } from '../services/auth.service';

function isApiErrorBody(v: unknown): v is ApiErrorBody {
  return (
    typeof v === 'object' &&
    v !== null &&
    'success' in v &&
    (v as ApiErrorBody).success === false &&
    typeof (v as ApiErrorBody).message === 'string'
  );
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(MessageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const skipToast = req.url.includes('/auth/login') || req.url.includes('/auth/register');

      if (err.status === 401) {
        if (!req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
          auth.clearSession();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.url === '/login' ? undefined : router.url },
          });
        }
      } else if (err.status === 403) {
        messages.add({
          severity: 'warn',
          summary: 'Access denied',
          detail: 'You do not have permission for this action or resource.',
        });
        void router.navigate(['/forbidden']);
      } else if (!skipToast) {
        const body = err.error;
        let detail = err.message;
        if (isApiErrorBody(body)) {
          detail = body.message;
        } else if (typeof body === 'object' && body && 'message' in body) {
          detail = String((body as { message: unknown }).message);
        }
        messages.add({
          severity: 'error',
          summary: 'Error',
          detail,
        });
      }
      return throwError(() => err);
    }),
  );
};
