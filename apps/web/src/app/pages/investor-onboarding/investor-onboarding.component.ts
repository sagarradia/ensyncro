import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { INVESTOR_TYPES, InvestorType } from '../../core/models';
import { ProfileService } from '../../core/profile.service';

/** Investor onboarding wizard (task #8), incl. the PRD §3 investor-type multi-select. */
@Component({
  selector: 'app-investor-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './investor-onboarding.component.html',
})
export class InvestorOnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profiles = inject(ProfileService);

  readonly investorTypeOptions = INVESTOR_TYPES;
  readonly totalSteps = 3;

  readonly step = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  /** Multi-select state, kept outside the form for simple checkbox toggling. */
  readonly selectedTypes = signal<InvestorType[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    sectors: [''], // comma-separated in the UI, sent as an array
    ticketMin: [null as number | null],
    ticketMax: [null as number | null],
    description: [''],
    website: [''],
    location: [''],
  });

  constructor() {
    this.profiles.getInvestor().subscribe({
      next: (p) => {
        if (p) {
          this.form.patchValue({
            name: p.name,
            sectors: (p.sectors ?? []).join(', '),
            ticketMin: p.ticketMin,
            ticketMax: p.ticketMax,
            description: p.description ?? '',
            website: p.website ?? '',
            location: p.location ?? '',
          });
          this.selectedTypes.set(p.investorTypes ?? []);
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

  isSelected(t: InvestorType): boolean {
    return this.selectedTypes().includes(t);
  }

  toggleType(t: InvestorType): void {
    const cur = this.selectedTypes();
    this.selectedTypes.set(cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  }

  /** Step 2 requires at least one investor type — mirrors the API's ArrayMinSize(1). */
  private stepValid(step: number): boolean {
    if (step === 1) return this.form.controls.name.valid;
    if (step === 2) return this.selectedTypes().length > 0;
    return true;
  }

  back(): void {
    if (this.step() > 1) this.step.set(this.step() - 1);
  }

  next(): void {
    if (!this.stepValid(this.step())) {
      if (this.step() === 1) this.form.controls.name.markAsTouched();
      this.error.set(
        this.step() === 2 ? 'Pick at least one investor type.' : 'Please complete this step.',
      );
      return;
    }
    // Only save once the API's required fields exist (name + >=1 type).
    if (this.step() >= 2) {
      this.save(false, () => this.step.set(Math.min(this.step() + 1, this.totalSteps)));
    } else {
      this.error.set(null);
      this.step.set(2);
    }
  }

  finish(): void {
    this.save(true, () => this.done.set(true));
  }

  private save(completed: boolean, after: () => void): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    this.profiles
      .saveInvestor({
        name: v.name,
        investorTypes: this.selectedTypes(),
        sectors: v.sectors
          ? v.sectors.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        ticketMin: v.ticketMin ?? undefined,
        ticketMax: v.ticketMax ?? undefined,
        description: v.description || undefined,
        website: v.website || undefined,
        location: v.location || undefined,
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
