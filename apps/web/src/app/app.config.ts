import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { EnsyncroPreset } from './theme/ensyncro-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: EnsyncroPreset,
        options: {
          // The design is a single light theme; point dark mode at a class we
          // never apply so it never activates regardless of OS preference.
          darkModeSelector: '.ensyncro-dark',
          // Keep PrimeNG's styles in their own cascade layer so Tailwind
          // utilities can override component layout without !important, while
          // the legacy hand-written CSS (still used by unmigrated pages) sits
          // below PrimeNG and cannot clobber its components.
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, legacy, primeng, tailwind-utilities',
          },
        },
      },
    }),
  ],
};
