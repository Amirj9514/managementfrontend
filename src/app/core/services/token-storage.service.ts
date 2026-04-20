import { Injectable } from '@angular/core';

const TOKEN_KEY = 'mgmt_access_token';
const USER_KEY = 'mgmt_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  getUserJson(): string | null {
    return sessionStorage.getItem(USER_KEY);
  }

  setUserJson(json: string): void {
    sessionStorage.setItem(USER_KEY, json);
  }

  clearUser(): void {
    sessionStorage.removeItem(USER_KEY);
  }

  clearAll(): void {
    this.clearToken();
    this.clearUser();
  }
}
