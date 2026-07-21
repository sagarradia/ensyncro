import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

/**
 * Requires a signed-in user; otherwise sends them to /login and remembers
 * where they were heading.
 *
 * These guards are a UX convenience only — the API enforces the same rules
 * server-side on every request (PRD §4), so bypassing the client changes
 * nothing.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Requires one of the given roles (implies authGuard). */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    const role = auth.role();
    if (role && roles.includes(role)) return true;

    // Signed in but wrong role — send them to their own area rather than /login.
    return router.createUrlTree([auth.homeRouteFor(role)]);
  };
