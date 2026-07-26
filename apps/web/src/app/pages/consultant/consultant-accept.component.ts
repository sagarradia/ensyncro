import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/**
 * Public page an invited consultant opens from their invite link
 * (/consultant/accept?token=…). They set a password; the account activates and
 * logs straight in, landing on the consultant dashboard.
 */
@Component({
  selector: 'app-consultant-accept',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultant-accept.component.html',
})
export class ConsultantAcceptComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  password = '';

  submit(): void {
    if (!this.token) {
      this.error.set('This invite link is missing its token.');
      return;
    }
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    this.auth.acceptConsultantInvite(this.token, this.password).subscribe({
      next: () => void this.router.navigateByUrl('/consultant'),
      error: (err) => {
        this.submitting.set(false);
        const m = (err as { error?: { message?: string | string[] } })?.error?.message;
        this.error.set(
          err?.status === 400
            ? 'This invite is invalid or has expired.'
            : Array.isArray(m) ? m.join(', ') : (m ?? 'Could not activate the account.'),
        );
      },
    });
  }
}
