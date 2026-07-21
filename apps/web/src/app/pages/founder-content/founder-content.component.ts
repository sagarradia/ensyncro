import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FounderContentService } from '../../core/founder-content.service';
import { UploadService } from '../../core/upload.service';
import {
  DataRoomVisibility,
  Financials,
  FounderMedia,
  FundingHistory,
  FUNDING_STAGES,
  MAX_BYTES_BY_KIND,
  ProfileSection,
  SectionAccessLogEntry,
  StorageUsage,
  VISIBILITY_OPTIONS,
} from '../../core/models';

/**
 * Everything a founder publishes beyond the onboarding basics: pitch video,
 * product page, and the two gated commercial sections.
 */
@Component({
  selector: 'app-founder-content',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './founder-content.component.html',
})
export class FounderContentComponent {
  private readonly content = inject(FounderContentService);
  private readonly uploads = inject(UploadService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly visibilityOptions = VISIBILITY_OPTIONS;
  readonly stages = FUNDING_STAGES;
  readonly videoMaxMb = MAX_BYTES_BY_KIND['PITCH_VIDEO'] / 1024 / 1024;
  readonly logoMaxMb = MAX_BYTES_BY_KIND['LOGO'] / 1024 / 1024;

  readonly media = signal<FounderMedia | null>(null);
  readonly financials = signal<Financials | null>(null);
  readonly funding = signal<FundingHistory | null>(null);
  readonly usage = signal<StorageUsage | null>(null);
  readonly sectionLog = signal<SectionAccessLogEntry[]>([]);

  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly videoProgress = signal<number | null>(null);
  readonly logoProgress = signal<number | null>(null);

  // Forms
  videoUrl = '';
  website = '';
  productName = '';
  tagline = '';
  productDescription = '';
  categoriesText = '';
  fin = { mrr: null as number | null, arr: null as number | null, monthlyBurn: null as number | null, runwayMonths: null as number | null, useOfFunds: '' };
  milestone = { title: '', description: '', occurredOn: '', achieved: false };
  round = { stage: 'SEED', amountRaised: null as number | null, preMoney: null as number | null, postMoney: null as number | null, closedOn: '', leadInvestor: '' };

  readonly quotaPercent = computed(() => {
    const u = this.usage();
    return u ? Math.min(100, Math.round((u.usedBytes / u.quotaBytes) * 100)) : 0;
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.content.media().subscribe({
      next: (m) => {
        this.media.set(m);
        this.website = m.website ?? '';
      },
      error: () => this.error.set('Complete your company profile first, then add media here.'),
    });
    this.content.financials().subscribe({
      next: (f) => {
        this.financials.set(f);
        this.fin = {
          mrr: f.mrr, arr: f.arr, monthlyBurn: f.monthlyBurn,
          runwayMonths: f.runwayMonths, useOfFunds: f.useOfFunds ?? '',
        };
      },
      error: () => undefined,
    });
    this.content.fundingRounds().subscribe({ next: (r) => this.funding.set(r), error: () => undefined });
    this.content.usage().subscribe({ next: (u) => this.usage.set(u), error: () => undefined });
    this.content.sectionAccessLog().subscribe({ next: (l) => this.sectionLog.set(l), error: () => undefined });
  }

  /** Angular refuses an iframe src unless it is explicitly trusted. Safe here:
   * the API rebuilds the embed URL from a provider and an id, so this value is
   * never raw founder input. */
  embed(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private fail(e: unknown, fallback: string): void {
    const m = (e as { error?: { message?: string | string[] } })?.error?.message;
    this.error.set(Array.isArray(m) ? m.join(', ') : (m ?? fallback));
  }

  // ── Media ──────────────────────────────────────────────────
  saveVideoLink(): void {
    this.error.set(null);
    this.content.saveMedia({ pitchVideoUrl: this.videoUrl || null }).subscribe({
      next: (m) => {
        this.media.set(m);
        this.notice.set(this.videoUrl ? 'Pitch video link saved.' : 'Pitch video removed.');
      },
      error: (e) => this.fail(e, 'Could not save that video link.'),
    });
  }

  saveWebsite(): void {
    this.error.set(null);
    this.content.saveMedia({ website: this.website || null }).subscribe({
      next: (m) => { this.media.set(m); this.notice.set('Website saved.'); },
      error: (e) => this.fail(e, 'Could not save the website.'),
    });
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);
    this.notice.set(null);

    const max = this.uploads.maxBytesFor('PITCH_VIDEO');
    if (file.size > max) {
      this.error.set(`"${file.name}" is ${this.mb(file.size)}MB — the limit is ${this.videoMaxMb}MB.`);
      input.value = '';
      return;
    }

    this.videoProgress.set(0);
    this.uploads.upload(file, 'PITCH_VIDEO', 'VISIBLE_TO_INVESTORS').subscribe({
      next: (p) => {
        this.videoProgress.set(p.percent);
        if (p.done && p.file) {
          this.content.saveMedia({ pitchVideoFileId: p.file.id }).subscribe({
            next: (m) => {
              this.media.set(m);
              this.videoProgress.set(null);
              this.notice.set('Pitch video uploaded.');
              this.content.usage().subscribe({ next: (u) => this.usage.set(u) });
            },
            error: (e) => { this.videoProgress.set(null); this.fail(e, 'Upload finished but linking it failed.'); },
          });
        }
      },
      error: (e) => { this.videoProgress.set(null); this.fail(e, 'Video upload failed.'); },
    });
    input.value = '';
  }

  removeVideo(): void {
    this.content.saveMedia({ pitchVideoUrl: null, pitchVideoFileId: null }).subscribe({
      next: (m) => { this.media.set(m); this.videoUrl = ''; this.notice.set('Pitch video removed.'); },
      error: (e) => this.fail(e, 'Could not remove the video.'),
    });
  }

  // ── Product ────────────────────────────────────────────────
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);

    if (file.size > this.uploads.maxBytesFor('LOGO')) {
      this.error.set(`Logo is ${this.mb(file.size)}MB — the limit is ${this.logoMaxMb}MB.`);
      input.value = '';
      return;
    }

    this.logoProgress.set(0);
    this.uploads.upload(file, 'LOGO', 'VISIBLE_TO_INVESTORS').subscribe({
      next: (p) => {
        this.logoProgress.set(p.percent);
        if (p.done && p.file) {
          this.content.saveProduct({ logoFileId: p.file.id }).subscribe({
            next: () => { this.logoProgress.set(null); this.notice.set('Logo updated.'); },
            error: (e) => { this.logoProgress.set(null); this.fail(e, 'Could not set the logo.'); },
          });
        }
      },
      error: (e) => { this.logoProgress.set(null); this.fail(e, 'Logo upload failed.'); },
    });
    input.value = '';
  }

  saveProduct(): void {
    this.error.set(null);
    this.content
      .saveProduct({
        productName: this.productName || null,
        tagline: this.tagline || null,
        productDescription: this.productDescription || null,
        categories: this.categoriesText.split(',').map((c) => c.trim()).filter(Boolean),
      })
      .subscribe({
        next: () => this.notice.set('Product page saved.'),
        error: (e) => this.fail(e, 'Could not save the product page.'),
      });
  }

  // ── Financials + milestones ────────────────────────────────
  saveFinancials(): void {
    this.error.set(null);
    this.content
      .saveFinancials({
        mrr: this.fin.mrr, arr: this.fin.arr, monthlyBurn: this.fin.monthlyBurn,
        runwayMonths: this.fin.runwayMonths, useOfFunds: this.fin.useOfFunds || null,
      })
      .subscribe({
        next: (f) => { this.financials.set(f); this.notice.set('Financials saved.'); },
        error: (e) => this.fail(e, 'Could not save financials.'),
      });
  }

  setVisibility(section: ProfileSection, event: Event): void {
    const visibility = (event.target as HTMLSelectElement).value as DataRoomVisibility;
    this.content.setSectionVisibility(section, visibility).subscribe({
      next: () => { this.notice.set(`${section === 'FINANCIALS' ? 'Financials' : 'Funding history'} visibility updated.`); this.refresh(); },
      error: (e) => this.fail(e, 'Could not change visibility.'),
    });
  }

  addMilestone(): void {
    if (!this.milestone.title || !this.milestone.occurredOn) {
      this.error.set('A milestone needs a title and a date.');
      return;
    }
    this.content.addMilestone({ ...this.milestone, description: this.milestone.description || undefined }).subscribe({
      next: () => { this.milestone = { title: '', description: '', occurredOn: '', achieved: false }; this.refresh(); },
      error: (e) => this.fail(e, 'Could not add the milestone.'),
    });
  }

  removeMilestone(id: string): void {
    this.content.removeMilestone(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  // ── Funding history ────────────────────────────────────────
  addRound(): void {
    if (this.round.amountRaised == null || !this.round.closedOn) {
      this.error.set('A round needs an amount and a close date.');
      return;
    }
    this.content
      .addFundingRound({
        stage: this.round.stage,
        amountRaised: this.round.amountRaised,
        preMoney: this.round.preMoney ?? undefined,
        postMoney: this.round.postMoney ?? undefined,
        closedOn: this.round.closedOn,
        leadInvestor: this.round.leadInvestor || undefined,
      })
      .subscribe({
        next: () => { this.round = { stage: 'SEED', amountRaised: null, preMoney: null, postMoney: null, closedOn: '', leadInvestor: '' }; this.refresh(); },
        error: (e) => this.fail(e, 'Could not add the round.'),
      });
  }

  removeRound(id: string): void {
    this.content.removeFundingRound(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  mb(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1);
  }

  money(n: number | null): string {
    return n == null ? '—' : n.toLocaleString();
  }
}
