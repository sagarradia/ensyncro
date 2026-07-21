import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DiscoverService } from '../../core/discover.service';
import { INVESTOR_TYPES, InvestorCard } from '../../core/models';

/** Founders browsing investors (task #11). */
@Component({
  selector: 'app-discover-investors',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './discover-investors.component.html',
})
export class DiscoverInvestorsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly discover = inject(DiscoverService);

  readonly investorTypes = INVESTOR_TYPES;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly items = signal<InvestorCard[]>([]);

  readonly filters = this.fb.nonNullable.group({
    investorType: [''],
    sector: [''],
    ticketMin: [null as number | null],
    ticketMax: [null as number | null],
  });

  constructor() {
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.discover.investors(this.filters.getRawValue()).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load investors.');
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.filters.reset({ investorType: '', sector: '', ticketMin: null, ticketMax: null });
    this.search();
  }

  ticketRange(i: InvestorCard): string {
    if (i.ticketMin === null && i.ticketMax === null) return 'Not specified';
    const lo = i.ticketMin === null ? '—' : i.ticketMin.toLocaleString();
    const hi = i.ticketMax === null ? '—' : i.ticketMax.toLocaleString();
    return `${lo} – ${hi}`;
  }

  typeLabel(value: string): string {
    return this.investorTypes.find((t) => t.value === value)?.label ?? value;
  }
}
