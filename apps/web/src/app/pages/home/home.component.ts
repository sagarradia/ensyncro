import { Component, computed, inject, signal } from '@angular/core';
import { CmsService, PublicContent } from '../../core/cms.service';

interface RoleCard {
  title: string;
  blurb: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly cms = inject(CmsService);

  /** Live marketing content (admin-editable). Null until it loads. */
  readonly content = signal<PublicContent | null>(null);

  // Fallbacks so the hero renders instantly and still works if the feed fails.
  readonly headline = computed(
    () => this.content()?.homepage.headline || 'Where founders and investors sync up.',
  );
  readonly subtext = computed(
    () =>
      this.content()?.homepage.subtext ||
      'Ensyncro is a funding marketplace connecting founders raising capital with investors across the full spectrum — angel, seed, VC, syndicate, and crowdfunding.',
  );
  readonly tiers = computed(() => this.content()?.pricing.tiers ?? []);
  readonly successFeePct = computed(() => this.content()?.pricing.successFeePct ?? null);

  readonly roles: RoleCard[] = [
    { title: 'Founders', blurb: 'Create a discoverable pitch, share a private data room, and reach the right investors.' },
    { title: 'Investors', blurb: 'Discover founders by sector, stage, and ticket size — angel through institutional.' },
    { title: 'Admins', blurb: 'Operate the platform and its content behind role-based access.' },
  ];

  constructor() {
    this.cms.publicContent().subscribe({
      next: (c) => this.content.set(c),
      error: () => undefined, // fall back to the defaults above
    });
  }
}
