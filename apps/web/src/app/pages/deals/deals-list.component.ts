import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DealsService } from '../../core/deals.service';
import { DealSummary } from '../../core/models';

/** Deal dashboard — the caller's deals (admins see all). PRD v2 §5. */
@Component({
  selector: 'app-deals-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './deals-list.component.html',
})
export class DealsListComponent {
  private readonly deals = inject(DealsService);
  private readonly auth = inject(AuthService);

  readonly items = signal<DealSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isAdmin = computed(() => this.auth.role() === 'ADMIN');

  constructor() {
    this.deals.list().subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('Could not load your deals.'); this.loading.set(false); },
    });
  }

  /** The other party, from the current user's perspective. */
  counterparty(d: DealSummary): string {
    const me = this.auth.user()?.id;
    if (this.isAdmin()) return `${d.founder.name} ↔ ${d.investor.name}`;
    return d.founder.userId === me ? d.investor.name : d.founder.name;
  }
}
