import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DiscoverService } from '../../core/discover.service';
import { FUNDING_STAGES, FounderCard } from '../../core/models';

/** Investors browsing founders (task #11). */
@Component({
  selector: 'app-discover-founders',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './discover-founders.component.html',
})
export class DiscoverFoundersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly discover = inject(DiscoverService);

  readonly stages = FUNDING_STAGES;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly items = signal<FounderCard[]>([]);

  readonly filters = this.fb.nonNullable.group({
    sector: [''],
    stage: [''],
    fundingMin: [null as number | null],
    fundingMax: [null as number | null],
  });

  constructor() {
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.discover.founders(this.filters.getRawValue()).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load founders.');
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.filters.reset({ sector: '', stage: '', fundingMin: null, fundingMax: null });
    this.search();
  }

  money(v: number | null): string {
    return v === null ? '—' : v.toLocaleString();
  }
}
