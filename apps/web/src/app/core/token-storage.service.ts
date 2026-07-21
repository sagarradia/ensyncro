import { Injectable } from '@angular/core';
import { AuthUser, TokenPair } from './models';

const ACCESS = 'ensyncro.accessToken';
const REFRESH = 'ensyncro.refreshToken';
const USER = 'ensyncro.user';

/**
 * Persists the session in localStorage.
 *
 * Trade-off: the API returns tokens in the JSON body, so the SPA has to hold
 * them somewhere reachable from JS — localStorage is the standard choice. It is
 * readable by injected scripts, so the mitigation is to keep XSS out (Angular
 * escapes by default) and keep access tokens short-lived (15 min) with
 * revocable refresh tokens server-side. Moving to httpOnly cookies would need
 * the API to set cookies instead, which is a phase-2 hardening option.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private get store(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  get accessToken(): string | null {
    return this.store?.getItem(ACCESS) ?? null;
  }

  get refreshToken(): string | null {
    return this.store?.getItem(REFRESH) ?? null;
  }

  get user(): AuthUser | null {
    const raw = this.store?.getItem(USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setSession(tokens: TokenPair, user: AuthUser): void {
    this.store?.setItem(ACCESS, tokens.accessToken);
    this.store?.setItem(REFRESH, tokens.refreshToken);
    this.store?.setItem(USER, JSON.stringify(user));
  }

  clear(): void {
    this.store?.removeItem(ACCESS);
    this.store?.removeItem(REFRESH);
    this.store?.removeItem(USER);
  }
}
