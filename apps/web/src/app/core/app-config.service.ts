import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PublicConfig {
  appEnv: string;
  demoLoginsEnabled: boolean;
}

/**
 * Public feature flags fetched from the API (GET /config).
 *
 * Fails closed: until the response arrives — or if it fails outright — flags
 * read as disabled, so we never render UI (like the pitch shortcuts) that the
 * server would reject.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<PublicConfig | null>(null);
  private loading = false;

  readonly config = this._config.asReadonly();
  readonly demoLoginsEnabled = computed(() => this._config()?.demoLoginsEnabled === true);

  /** Loads once; safe to call from multiple components. */
  load(): void {
    if (this.loading || this._config() !== null) return;
    this.loading = true;

    this.http.get<PublicConfig>(`${environment.apiBaseUrl}/config`).subscribe({
      next: (cfg) => {
        this._config.set(cfg);
        this.loading = false;
      },
      error: () => {
        this._config.set({ appEnv: 'unknown', demoLoginsEnabled: false });
        this.loading = false;
      },
    });
  }
}
