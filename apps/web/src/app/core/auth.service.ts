import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token-storage.service';
import { AuthUser, LoginResponse, OtpChannel, Role, SignupResponse } from './models';

export interface SignupPayload {
  email: string;
  mobile: string;
  password: string;
  role: Extract<Role, 'FOUNDER' | 'INVESTOR'>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly base = environment.apiBaseUrl;

  private readonly _user = signal<AuthUser | null>(this.storage.user);
  /** Current signed-in user, or null. */
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  /** Public signup — Founder or Investor only (admins are invite-only). */
  signup(payload: SignupPayload): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.base}/auth/signup`, payload);
  }

  verifyOtp(userId: string, channel: OtpChannel, code: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base}/auth/verify-otp`, {
      userId,
      channel,
      code,
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/auth/login`, { email, password })
      .pipe(tap((res) => this.startSession(res)));
  }

  logout(): void {
    const refreshToken = this.storage.refreshToken;
    // Best-effort server-side revocation; the local session is cleared either way.
    if (refreshToken) {
      this.http.post(`${this.base}/auth/logout`, { refreshToken }).subscribe({
        error: () => undefined,
      });
    }
    this.storage.clear();
    this._user.set(null);
  }

  /** Where a user should land after authenticating. */
  homeRouteFor(role: Role | null): string {
    switch (role) {
      case 'FOUNDER':
        return '/founder/onboarding';
      case 'INVESTOR':
        return '/investor/onboarding';
      case 'ADMIN':
        return '/';
      default:
        return '/';
    }
  }

  private startSession(res: LoginResponse): void {
    this.storage.setSession(res, res.user);
    this._user.set(res.user);
  }
}
