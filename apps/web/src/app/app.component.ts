import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main style="max-width: 640px; margin: 4rem auto; padding: 0 1.5rem;">
      <h1 style="color: var(--color-accent);">Ensyncro</h1>
      <p style="color: var(--color-text-secondary);">
        Funding marketplace — monorepo skeleton.
        Environment: <strong>{{ env }}</strong>
      </p>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  readonly env = environment.appEnv;
}
