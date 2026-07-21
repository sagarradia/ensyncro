import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';

/** Signup is two steps: create the account, then verify email + mobile OTPs. */
type Step = 'details' | 'verify';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('details');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly mockCodes = signal(false);

  private userId = '';

  readonly detailsForm = this.fb.nonNullable.group({
    role: ['FOUNDER' as 'FOUNDER' | 'INVESTOR', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
    ],
  });

  readonly verifyForm = this.fb.nonNullable.group({
    emailCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    mobileCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  submitDetails(): void {
    if (this.detailsForm.invalid || this.submitting()) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    this.auth.signup(this.detailsForm.getRawValue()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.userId = res.userId;
        // In mock OTP mode the API returns the codes so the flow is testable.
        if (res.devOtp?.email || res.devOtp?.mobile) {
          this.mockCodes.set(true);
          this.verifyForm.patchValue({
            emailCode: res.devOtp.email ?? '',
            mobileCode: res.devOtp.mobile ?? '',
          });
        }
        this.step.set('verify');
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(
          err?.status === 409
            ? 'That email or mobile is already registered.'
            : 'Could not create the account. Check the details and try again.',
        );
      },
    });
  }

  submitVerify(): void {
    if (this.verifyForm.invalid || this.submitting()) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    const { emailCode, mobileCode } = this.verifyForm.getRawValue();
    // Both channels must be verified before the account becomes ACTIVE.
    forkJoin([
      this.auth.verifyOtp(this.userId, 'EMAIL', emailCode),
      this.auth.verifyOtp(this.userId, 'MOBILE', mobileCode),
    ]).subscribe({
      next: () => {
        // Log in with the credentials just used, so the user lands in the wizard.
        const { email, password } = this.detailsForm.getRawValue();
        this.auth.login(email, password).subscribe({
          next: (res) => void this.router.navigateByUrl(this.auth.homeRouteFor(res.user.role)),
          error: () => {
            this.submitting.set(false);
            this.error.set('Account verified, but automatic login failed. Please log in.');
          },
        });
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('One of those codes is invalid or expired.');
      },
    });
  }
}
