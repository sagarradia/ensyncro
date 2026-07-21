import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FUNDING_STAGES, FundingStage } from '../../core/models';
import { ProfileService } from '../../core/profile.service';

/** Founder onboarding wizard (task #7) — company profile, saved step by step. */
@Component({
  selector: 'app-founder-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './founder-onboarding.component.html',
})
export class FounderOnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profiles = inject(ProfileService);

  readonly stages = FUNDING_STAGES;
  readonly totalSteps = 3;

  readonly step = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  readonly form = this.fb.nonNullable.group({
    // Step 1 — required by the API on every save.
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    sector: ['', [Validators.required, Validators.minLength(2)]],
    stage: ['SEED' as FundingStage, [Validators.required]],
    // Step 2
    fundingSought: [null as number | null],
    teamSize: [null as number | null],
    location: [''],
    website: [''],
    // Step 3
    description: [''],
  });

  constructor() {
    this.profiles.getFounder().subscribe({
      next: (p) => {
        if (p) {
          this.form.patchValue({
            companyName: p.companyName,
            sector: p.sector,
            stage: p.stage,
            fundingSought: p.fundingSought,
            teamSize: p.teamSize,
            location: p.location ?? '',
            website: p.website ?? '',
            description: p.description ?? '',
          });
          this.done.set(p.completed);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your profile.');
        this.loading.set(false);
      },
    });
  }

  /** Controls that must be valid before leaving the current step. */
  private stepControls(step: number): string[] {
    if (step === 1) return ['companyName', 'sector', 'stage'];
    if (step === 2) return ['fundingSought', 'teamSize', 'location', 'website'];
    return ['description'];
  }

  private stepValid(step: number): boolean {
    return this.stepControls(step).every((c) => this.form.get(c)!.valid);
  }

  back(): void {
    if (this.step() > 1) this.step.set(this.step() - 1);
  }

  next(): void {
    if (!this.stepValid(this.step())) {
      this.stepControls(this.step()).forEach((c) => this.form.get(c)!.markAsTouched());
      return;
    }
    // Persist progress so a refresh doesn't lose the step.
    this.save(false, () => this.step.set(Math.min(this.step() + 1, this.totalSteps)));
  }

  finish(): void {
    if (!this.stepValid(3)) return;
    this.save(true, () => this.done.set(true));
  }

  private save(completed: boolean, after: () => void): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    this.profiles
      .saveFounder({
        companyName: v.companyName,
        sector: v.sector,
        stage: v.stage,
        fundingSought: v.fundingSought ?? undefined,
        teamSize: v.teamSize ?? undefined,
        location: v.location || undefined,
        website: v.website || undefined,
        description: v.description || undefined,
        completed,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          after();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Could not save. Check the fields and try again.');
        },
      });
  }
}
