import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * When the API is reached through an ngrok tunnel, ngrok answers browser requests with its HTML
 * "you are about to visit…" interstitial instead of our JSON until this header is present.
 * Only added to calls aimed at our own backend (environment.apiUrl) — never to third-party URLs.
 * Harmless when not behind ngrok: the backend just ignores the header.
 */
export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { 'ngrok-skip-browser-warning': 'true' } }));
};
