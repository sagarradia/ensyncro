import { Component, inject } from '@angular/core';
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
  readonly year = new Date().getFullYear();

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
