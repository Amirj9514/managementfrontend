import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

/** Sends the active UI language so the API can return localized validation/error messages. */
export const langInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(TranslationService);
  const lang = i18n.currentLang();
  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': lang,
        'X-App-Lang': lang,
      },
    }),
  );
};
