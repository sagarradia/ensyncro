import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AppConfigService } from '../../core/app-config.service';
import { DEMO_SHORTCUTS, DemoRole } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly appConfig = inject(AppConfigService);

  readonly shortcuts = DEMO_SHORTCUTS;
  /** Hides the whole shortcuts section when the API has them switched off. */
  readonly demoLoginsEnabled = this.appConfig.demoLoginsEnabled;

  constructor() {
    this.appConfig.load();
  }

  readonly submitting = signal(false);
  /** Which shortcut is mid-flight, so only that button shows a spinner. */
  readonly demoLoading = signal<DemoRole | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => this.goAfterLogin(res.user.role),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(
          err?.status === 403
            ? 'This account is not verified yet. Finish the codes from signup first.'
            : 'Invalid email or password.',
        );
      },
    });
  }

  demoLogin(role: DemoRole): void {
    if (this.demoLoading()) return;
    this.demoLoading.set(role);
    this.error.set(null);

    this.auth.demoLogin(role).subscribe({
      next: (res) => this.goAfterLogin(res.user.role),
      error: (err) => {
        this.demoLoading.set(null);
        this.error.set(
          err?.status === 404
            ? 'Demo accounts are not seeded on this environment yet.'
            : err?.status === 403
              ? 'Demo logins are disabled on this environment.'
              : 'Could not start the demo session.',
        );
      },
    });
  }

  private goAfterLogin(role: string): void {
    const returnUrl = new URLSearchParams(location.search).get('returnUrl');
    void this.router.navigateByUrl(returnUrl || this.auth.homeRouteFor(role as never));
  }
}
