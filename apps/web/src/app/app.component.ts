import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
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
  /** Intros are a founder<->investor handshake; admins have no inbox. */
  readonly canIntro = computed(() => {
    const role = this.auth.role();
    return role === 'FOUNDER' || role === 'INVESTOR';
  });
  readonly year = new Date().getFullYear();

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
