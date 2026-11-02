import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  defaultIfEmpty,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api.types';
import type { AuthUser, LoginResponseData } from '../models/user.model';
import type { NavItem } from '../config/nav-items';
import { userCan } from '../models/permissions.model';
import type { UserRole } from '../models/roles.model';
import { TokenStorageService } from './token-storage.service';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorageService);
  private readonly api = inject(ApiClientService);

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly user$: Observable<AuthUser | null> = this.userSubject.asObservable();
  /** Signal twin of `user$` so permission checks in templates/effects react to profile changes. */
  private readonly userSignal = toSignal(this.user$, { initialValue: null });
  /** One profile refresh per page load / session; guards wait on it so cached permissions are never trusted blindly. */
  private fresh$?: Observable<void>;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    const token = this.storage.getToken();
    const raw = this.storage.getUserJson();
    if (token && raw) {
      try {
        const cached = JSON.parse(raw) as AuthUser;
        if (!Array.isArray(cached.permissions)) {
          // Session saved before permissions existed — sign in again to get them.
          this.clearSession();
          return;
        }
        this.userSubject.next(cached);
      } catch {
        this.clearSession();
      }
    }
  }

  getUser(): AuthUser | null {
    return this.userSubject.value;
  }

  getToken(): string | null {
    return this.storage.getToken();
  }

  isAuthenticated(): boolean {
    return !!this.storage.getToken() && !!this.userSubject.value;
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    const u = this.userSubject.value;
    return !!u && roles.includes(u.role);
  }

  /** True when the user may do at least one of the actions; admins and super admins always can. */
  can(...keys: string[]): boolean {
    return userCan(this.userSignal(), keys);
  }

  /** Nav entries use `permissions` (any-of) when set, otherwise the legacy role list. */
  canSeeNavItem(item: NavItem, user: AuthUser | null = this.userSignal()): boolean {
    if (!user) return false;
    if (item.permissions) return userCan(user, item.permissions);
    if (item.roles) return item.roles.includes(user.role);
    return true; // neither list set = open to every signed-in user
  }

  /** Refreshes the profile at most once per session, then emits (also when the refresh fails). */
  ensureFresh(): Observable<void> {
    this.fresh$ ??= this.refreshProfile().pipe(defaultIfEmpty(undefined), shareReplay(1));
    return this.fresh$;
  }

  /** Re-reads the profile so permission changes made by an admin apply without logging in again. */
  refreshProfile(): Observable<void> {
    return this.api.get<{ user: AuthUser }>('auth/me').pipe(
      tap(({ user }) => {
        this.storage.setUserJson(JSON.stringify(user));
        this.userSubject.next(user);
      }),
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((body) => this.api.unwrap(body)),
        tap((data) => this.persistSession(data.user, data.token)),
        map(() => undefined),
        catchError((err) => throwError(() => err)),
      );
  }

  register(payload: { email: string; password: string; name: string }): Observable<void> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        map((body) => this.api.unwrap(body)),
        tap((data) => this.persistSession(data.user, data.token)),
        map(() => undefined),
        catchError((err) => throwError(() => err)),
      );
  }

  private persistSession(user: AuthUser, token: string): void {
    this.storage.setToken(token);
    this.storage.setUserJson(JSON.stringify(user));
    this.userSubject.next(user);
    this.fresh$ = of(undefined);
  }

  clearSession(): void {
    this.fresh$ = undefined;
    this.storage.clearAll();
    this.userSubject.next(null);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
}
