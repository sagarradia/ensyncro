import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly env = environment.appEnv;

  /** Investors browse founders; founders browse investors. */
  readonly discoverLink = computed(() => {
    const role = this.auth.role();
    if (role === 'INVESTOR' || role === 'ADMIN') return '/discover/founders';
    if (role === 'FOUNDER') return '/discover/investors';
    return null;
  });
  readonly isFounder = computed(() => this.auth.role() === 'FOUNDER');
  readonly isConsultant = computed(() => this.auth.role() === 'CONSULTANT');
  readonly isAdmin = computed(() => this.auth.role() === 'ADMIN');
  /** Deals are held by founders/investors; admins oversee all of them. */
  readonly canSeeDeals = computed(() => {
    const role = this.auth.role();
    return role === 'FOUNDER' || role === 'INVESTOR' || role === 'ADMIN';
  });
  /** Intros are a founder<->investor handshake; admins have no inbox. */
  readonly canIntro = computed(() => {
    const role = this.auth.role();
    return role === 'FOUNDER' || role === 'INVESTOR';
  });
  readonly year = new Date().getFullYear();

  /**
   * The public landing page renders its own marketing nav + footer, so the app
   * shell chrome (and the max-width content container) is suppressed there.
   */
  private readonly currentUrl = signal(this.router.url);
  readonly isLanding = computed(() => this.currentUrl().split(/[?#]/)[0] === '/');

  /** Mobile nav menu open state (below the md breakpoint). */
  readonly mobileMenuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
