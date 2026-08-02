import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth.service';
import { CmsService, PlatformStats, PublicContent } from '../../core/cms.service';
import { CollectionsService, HomepageCollections } from '../../core/collections.service';

interface Feature {
  icon: string;
  title: string;
  blurb: string;
}
interface Step {
  n: number;
  title: string;
  blurb: string;
}

/**
 * The public marketing landing page. Renders its own nav + footer (the app
 * shell chrome is suppressed on this route). Copy and pricing come from
 * cms_content; the stats row is live platform counts — nothing hardcoded that
 * an admin is meant to control.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ButtonModule, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly cms = inject(CmsService);
  private readonly collectionsSvc = inject(CollectionsService);
  readonly auth = inject(AuthService);

  readonly content = signal<PublicContent | null>(null);
  readonly stats = signal<PlatformStats | null>(null);
  readonly collections = signal<HomepageCollections | null>(null);
  readonly mobileOpen = signal(false);
  readonly year = new Date().getFullYear();

  // Fallbacks so the hero renders instantly and survives a failed feed.
  readonly tagline = computed(() => this.content()?.homepage.tagline || '');
  readonly cta = computed(() => this.content()?.homepage.cta ?? null);
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

  // Repeatable collections — sections hide themselves when empty.
  readonly sampleListings = computed(() => this.collections()?.sampleListings ?? []);
  readonly matchPreview = computed(() => this.collections()?.matchPreview ?? null);
  readonly team = computed(() => this.collections()?.team ?? []);
  readonly testimonials = computed(() => this.collections()?.testimonials ?? []);
  readonly blog = computed(() => this.collections()?.blog ?? []);
  readonly achievements = computed(() => this.collections()?.achievements ?? []);

  media(rel: string | null): string | null {
    return this.collectionsSvc.mediaUrl(rel);
  }

  /** Where a signed-in visitor's primary action should take them. */
  readonly appLink = computed(() => {
    const role = this.auth.role();
    if (role === 'INVESTOR' || role === 'ADMIN') return '/discover/founders';
    if (role === 'FOUNDER') return '/discover/investors';
    if (role === 'CONSULTANT') return '/consultant';
    return '/login';
  });

  readonly navLinks: readonly { label: string; href: string }[] = [
    { label: 'For Investors', href: '#for-investors' },
    { label: 'For Founders', href: '#for-founders' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  readonly founderFeatures: readonly Feature[] = [
    { icon: 'pi-id-card', title: 'Structured company profile', blurb: 'Build a rich, investor-ready profile — promoters, business model, market, financials and more — in a guided flow.' },
    { icon: 'pi-file-pdf', title: 'One-click Teaser & IM', blurb: 'Auto-generate a polished teaser and a full information memorandum from your profile. Always current, never re-typed.' },
    { icon: 'pi-lock', title: 'Private data room', blurb: 'Share documents on your terms, with per-file visibility and a full audit trail of who viewed what.' },
    { icon: 'pi-compass', title: 'Reach the right investors', blurb: 'Get discovered by investors filtering on your sector, stage and ticket size — no cold outreach.' },
  ];

  readonly investorFeatures: readonly Feature[] = [
    { icon: 'pi-search', title: 'Targeted discovery', blurb: 'Filter founders by sector, stage and geography and open a structured profile for each — signal over noise.' },
    { icon: 'pi-chart-line', title: 'Financials on request', blurb: 'Request access to gated financials, cap tables and projections; founders grant it deal by deal, all audited.' },
    { icon: 'pi-folder-open', title: 'Data room access', blurb: 'Review shared documents in a controlled data room once a founder opens it to you.' },
  ];

  readonly steps: readonly Step[] = [
    { n: 1, title: 'Build your profile', blurb: 'Founders publish a structured profile; investors set their thesis. It takes minutes.' },
    { n: 2, title: 'Discover & connect', blurb: 'Investors find founders that fit and request an intro. Founders choose who to engage.' },
    { n: 3, title: 'Move to a deal', blurb: 'An accepted intro opens a deal — track it through stages with a shared timeline, tasks and the data room.' },
  ];

  constructor() {
    this.cms.publicContent().subscribe({ next: (c) => this.content.set(c), error: () => undefined });
    this.cms.stats().subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
    this.collectionsSvc.homepage().subscribe({ next: (c) => this.collections.set(c), error: () => undefined });
  }

  toggleMobile(): void {
    this.mobileOpen.update((o) => !o);
  }
  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
