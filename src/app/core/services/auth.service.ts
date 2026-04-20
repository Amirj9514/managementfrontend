import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api.types';
import type { AuthUser, LoginResponseData } from '../models/user.model';
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

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    const token = this.storage.getToken();
    const raw = this.storage.getUserJson();
    if (token && raw) {
      try {
        this.userSubject.next(JSON.parse(raw) as AuthUser);
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
  }

  clearSession(): void {
    this.storage.clearAll();
    this.userSubject.next(null);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
}
