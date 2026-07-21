import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token-storage.service';

/**
 * Attaches the access token to Ensyncro API calls.
 *
 * The URL check matters: without it the Authorization header would be sent to
 * any host the app happens to call, leaking the token to third parties.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorageService).accessToken;

  if (!token || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
