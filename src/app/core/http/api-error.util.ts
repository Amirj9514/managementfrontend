import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, type AbstractControl } from '@angular/forms';
import type { ApiErrorBody, ApiFieldError, ApiValidationDetails } from '../models/api.types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isApiErrorBody(v: unknown): v is ApiErrorBody {
  return (
    isRecord(v) &&
    v['success'] === false &&
    typeof v['message'] === 'string'
  );
}

export function isApiValidationDetails(v: unknown): v is ApiValidationDetails {
  return isRecord(v) && Array.isArray(v['fields']);
}

/** Extracts the API error envelope from an HttpErrorResponse (or nested shape). */
export function getApiErrorBody(err: unknown): ApiErrorBody | null {
  if (err instanceof HttpErrorResponse) {
    return isApiErrorBody(err.error) ? err.error : null;
  }
  if (isApiErrorBody(err)) return err;
  return null;
}

export function getApiFieldErrors(err: unknown): ApiFieldError[] {
  const body = getApiErrorBody(err);
  if (!body || !isApiValidationDetails(body.details)) return [];
  return body.details.fields.filter(
    (f): f is ApiFieldError =>
      isRecord(f) && typeof f.field === 'string' && typeof f.message === 'string',
  );
}

/**
 * Best user-facing message for a failed request:
 * first field message when present, else API message, else fallback.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const fields = getApiFieldErrors(err);
  if (fields[0]?.message) return fields[0].message;

  const body = getApiErrorBody(err);
  if (body?.message) return body.message;

  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }

  if (err instanceof Error && err.message && !err.message.startsWith('Http failure')) {
    return err.message;
  }

  return fallback;
}

/** Clears previously applied `{ server: ... }` errors so a retry starts clean. */
export function clearServerFieldErrors(form: FormGroup): void {
  for (const key of Object.keys(form.controls)) {
    clearServerOnControl(form.controls[key]!);
  }
}

/** Maps API field errors onto an Angular form (sets `{ server: message }` per control). */
export function applyApiFieldErrors(form: FormGroup, err: unknown): void {
  clearServerFieldErrors(form);
  const fields = getApiFieldErrors(err);
  for (const field of fields) {
    if (field.field === '_form') continue;
    const control = findControl(form, field.field);
    if (!control) continue;
    control.setErrors({ ...(control.errors ?? {}), server: field.message });
    control.markAsTouched();
  }
}

function clearServerOnControl(control: AbstractControl): void {
  const errors = control.errors;
  if (!errors || !('server' in errors)) return;
  const rest = { ...errors };
  delete rest['server'];
  control.setErrors(Object.keys(rest).length ? rest : null);
  if (control instanceof FormGroup) {
    for (const key of Object.keys(control.controls)) {
      clearServerOnControl(control.controls[key]!);
    }
  }
}

function findControl(root: AbstractControl, path: string): AbstractControl | null {
  const parts = path.split('.');
  let current: AbstractControl | null = root;
  for (const part of parts) {
    if (!current) return null;
    current = current.get(part);
  }
  return current;
}
