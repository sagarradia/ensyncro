import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FounderContentService } from '../../core/founder-content.service';
import { IntroService } from '../../core/intro.service';
import { Financials, FundingHistory, ProductPage } from '../../core/models';

/**
 * A founder's public product page. Financials and funding history are fetched
 * separately and only when the server says this viewer may see them — each of
 * those calls is authorised and audited on the API side.
 */
@Component({
  selector: 'app-product',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './product.component.html',
})
export class ProductComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly content = inject(FounderContentService);
  private readonly intros = inject(IntroService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly product = signal<ProductPage | null>(null);
  readonly financials = signal<Financials | null>(null);
  readonly funding = signal<FundingHistory | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly introNotice = signal<string | null>(null);
  readonly introSent = signal(false);

  introNote = '';

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId')!;
    this.content.product(userId).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        // Only ask for what we have been told we can see, so a locked section
        // never shows a spurious error.
        if (p.access.financials) {
          this.content.theirFinancials(userId).subscribe({ next: (f) => this.financials.set(f) });
        }
        if (p.access.fundingHistory) {
          this.content.theirFundingHistory(userId).subscribe({ next: (h) => this.funding.set(h) });
        }
      },
      error: () => {
        this.error.set('That profile is not available.');
        this.loading.set(false);
      },
    });
  }

  /** Safe: the API rebuilds this URL from a provider and a video id. */
  embed(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  requestIntro(): void {
    const p = this.product();
    if (!p) return;
    this.introNotice.set(null);
    this.intros.request(p.userId, this.introNote || undefined).subscribe({
      next: () => {
        this.introSent.set(true);
        this.introNotice.set('Intro requested. You will see their reply in your intros.');
      },
      error: (e) => {
        const m = (e as { error?: { message?: string | string[] } })?.error?.message;
        this.introNotice.set(Array.isArray(m) ? m.join(', ') : (m ?? 'Could not send that request.'));
      },
    });
  }

  money(n: number | null | undefined): string {
    return n == null ? '—' : n.toLocaleString();
  }
}
