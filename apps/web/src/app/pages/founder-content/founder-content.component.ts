import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/auth.service';
import { FounderContentService } from '../../core/founder-content.service';
import { UploadService } from '../../core/upload.service';
import { DocDownloadsComponent } from '../documents/doc-downloads.component';
import {
  BusinessStage,
  CompanyClassification,
  DataRoomVisibility,
  Financials,
  FounderMedia,
  FundingHistory,
  FundingRequirementType,
  FUNDING_STAGES,
  MAX_BYTES_BY_KIND,
  NatureOfBusiness,
  OwnSections,
  ProfileSection,
  RiskSeverity,
  SectionAccessLogEntry,
  SectorOption,
  StorageUsage,
  SwotCategory,
  VISIBILITY_OPTIONS,
} from '../../core/models';

const NATURE_OPTIONS: readonly { value: NatureOfBusiness; label: string }[] = [
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'TRADING', label: 'Trading' },
  { value: 'SERVICE', label: 'Service' },
];
const STAGE_OPTIONS: readonly { value: BusinessStage; label: string }[] = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'EARLY_REVENUE', label: 'Early revenue' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'EXPANSION', label: 'Expansion' },
  { value: 'MATURE', label: 'Mature' },
  { value: 'TURNAROUND', label: 'Turnaround' },
];
const CLASSIFICATION_OPTIONS: readonly { value: CompanyClassification; label: string }[] = [
  { value: 'MSME', label: 'MSME' },
  { value: 'LARGE_ENTERPRISE', label: 'Large enterprise' },
  { value: 'LISTED', label: 'Listed' },
  { value: 'UNLISTED', label: 'Unlisted' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'PSU', label: 'PSU' },
];
const FUNDING_TYPE_OPTIONS: readonly { value: FundingRequirementType; label: string }[] = [
  { value: 'SEED', label: 'Seed' },
  { value: 'ANGEL', label: 'Angel' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'EXPANSION', label: 'Expansion' },
  { value: 'BRIDGE', label: 'Bridge' },
  { value: 'PRE_IPO', label: 'Pre-IPO' },
  { value: 'STRATEGIC', label: 'Strategic' },
  { value: 'ACQUISITION', label: 'Acquisition' },
];

const SWOT_CATEGORIES: readonly { value: SwotCategory; label: string }[] = [
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'WEAKNESS', label: 'Weakness' },
  { value: 'OPPORTUNITY', label: 'Opportunity' },
  { value: 'THREAT', label: 'Threat' },
];

const RISK_SEVERITIES: readonly { value: RiskSeverity; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

/**
 * Everything a founder publishes beyond the onboarding basics: pitch video,
 * product page, and the two gated commercial sections.
 */
@Component({
  selector: 'app-founder-content',
  standalone: true,
  imports: [FormsModule, DatePipe, DocDownloadsComponent],
  templateUrl: './founder-content.component.html',
})
export class FounderContentComponent {
  private readonly content = inject(FounderContentService);
  private readonly uploads = inject(UploadService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly auth = inject(AuthService);

  readonly visibilityOptions = VISIBILITY_OPTIONS;
  readonly stages = FUNDING_STAGES;
  readonly swotCategories = SWOT_CATEGORIES;
  readonly riskSeverities = RISK_SEVERITIES;
  readonly natureOptions = NATURE_OPTIONS;
  readonly stageOptions = STAGE_OPTIONS;
  readonly classificationOptions = CLASSIFICATION_OPTIONS;
  readonly fundingTypeOptions = FUNDING_TYPE_OPTIONS;
  readonly sectorOptions = signal<SectorOption[]>([]);
  readonly videoMaxMb = MAX_BYTES_BY_KIND['PITCH_VIDEO'] / 1024 / 1024;
  readonly logoMaxMb = MAX_BYTES_BY_KIND['LOGO'] / 1024 / 1024;

  readonly media = signal<FounderMedia | null>(null);
  readonly financials = signal<Financials | null>(null);
  readonly funding = signal<FundingHistory | null>(null);
  readonly usage = signal<StorageUsage | null>(null);
  readonly sectionLog = signal<SectionAccessLogEntry[]>([]);
  /** All the structured VMB sections for editing. */
  readonly sections = signal<OwnSections | null>(null);

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
  fin = {
    mrr: null as number | null, arr: null as number | null, monthlyBurn: null as number | null,
    runwayMonths: null as number | null, useOfFunds: '',
    annualRevenue: null as number | null, grossMarginPct: null as number | null,
    cashBalance: null as number | null, priorYearArr: null as number | null,
  };
  milestone = { title: '', description: '', occurredOn: '', achieved: false };
  round = { stage: 'SEED', amountRaised: null as number | null, preMoney: null as number | null, postMoney: null as number | null, closedOn: '', leadInvestor: '' };

  // Public structured detail (saved via the product update).
  usp = '';
  businessModel = '';
  marketSize = '';
  targetSegment = '';
  marketGeography = '';

  // "New item" forms for the structured list sections.
  newPromoter = { name: '', background: '', shareholdingPct: null as number | null, priorExperience: '' };
  newGroupCompany = { name: '', relationship: '', ownershipPct: null as number | null };
  newProdSvc = { name: '', description: '', category: '' };
  newCompetitor = { name: '', differentiation: '' };
  newSwot = { category: 'STRENGTH' as SwotCategory, text: '' };
  newRisk = { title: '', description: '', severity: '' as RiskSeverity | '' };
  newPlan = { title: '', description: '', timeframe: '' };
  newPeer = { peerName: '', arr: null as number | null, growthPct: null as number | null, grossMarginPct: null as number | null, note: '' };

  // Classification / funding requirement / operations (public meta).
  meta = {
    natureOfBusiness: [] as NatureOfBusiness[],
    businessStage: '' as BusinessStage | '',
    companyClassification: '' as CompanyClassification | '',
    sector: '',
    fundingRequirementType: '' as FundingRequirementType | '',
    fundingInstrument: '',
    fundingUseSummary: '',
    fundingSought: null as number | null,
    manufacturing: '',
    operations: '',
  };
  newShareholder = { name: '', shareClass: '', percentage: null as number | null };
  newCustomer = { name: '', description: '' };
  newSupplier = { name: '', description: '' };
  newProjected = { periodLabel: '', revenue: null as number | null, ebitda: null as number | null, note: '' };

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
          annualRevenue: f.annualRevenue, grossMarginPct: f.grossMarginPct,
          cashBalance: f.cashBalance, priorYearArr: f.priorYearArr,
        };
      },
      error: () => undefined,
    });
    this.content.fundingRounds().subscribe({ next: (r) => this.funding.set(r), error: () => undefined });
    this.content.usage().subscribe({ next: (u) => this.usage.set(u), error: () => undefined });
    this.content.sectionAccessLog().subscribe({ next: (l) => this.sectionLog.set(l), error: () => undefined });
    this.content.sections().subscribe({
      next: (s) => {
        this.sections.set(s);
        this.usp = s.usp ?? '';
        this.businessModel = s.businessModel ?? '';
        this.marketSize = s.marketSize ?? '';
        this.targetSegment = s.targetSegment ?? '';
        this.marketGeography = s.marketGeography ?? '';
        this.meta = {
          natureOfBusiness: s.natureOfBusiness ?? [],
          businessStage: s.businessStage ?? '',
          companyClassification: s.companyClassification ?? '',
          sector: s.sector ?? '',
          fundingRequirementType: s.fundingRequirementType ?? '',
          fundingInstrument: s.fundingInstrument ?? '',
          fundingUseSummary: s.fundingUseSummary ?? '',
          fundingSought: s.fundingSought,
          manufacturing: s.manufacturing ?? '',
          operations: s.operations ?? '',
        };
      },
      error: () => undefined,
    });
    this.content.sectors().subscribe({ next: (o) => this.sectorOptions.set(o), error: () => undefined });
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

  /** USP / business model / market — public structured detail. */
  saveNarrative(): void {
    this.error.set(null);
    this.content
      .saveProduct({
        usp: this.usp || null,
        businessModel: this.businessModel || null,
        marketSize: this.marketSize || null,
        targetSegment: this.targetSegment || null,
        marketGeography: this.marketGeography || null,
      })
      .subscribe({
        next: () => this.notice.set('Saved.'),
        error: (e) => this.fail(e, 'Could not save.'),
      });
  }

  // ── Financials + milestones ────────────────────────────────
  saveFinancials(): void {
    this.error.set(null);
    this.content
      .saveFinancials({
        mrr: this.fin.mrr, arr: this.fin.arr, monthlyBurn: this.fin.monthlyBurn,
        runwayMonths: this.fin.runwayMonths, useOfFunds: this.fin.useOfFunds || null,
        annualRevenue: this.fin.annualRevenue, grossMarginPct: this.fin.grossMarginPct,
        cashBalance: this.fin.cashBalance, priorYearArr: this.fin.priorYearArr,
      })
      .subscribe({
        next: (f) => { this.financials.set(f); this.notice.set('Financials saved.'); },
        error: (e) => this.fail(e, 'Could not save financials.'),
      });
  }

  readonly sectionLabels: Record<ProfileSection, string> = {
    FINANCIALS: 'Financials',
    FUNDING_HISTORY: 'Funding history',
    RISKS: 'Risks',
    FUTURE_PLANS: 'Future plans',
    SHAREHOLDING: 'Shareholding',
    PROJECTED_FINANCIALS: 'Projected financials',
  };

  setVisibility(section: ProfileSection, event: Event): void {
    const visibility = (event.target as HTMLSelectElement).value as DataRoomVisibility;
    this.content.setSectionVisibility(section, visibility).subscribe({
      next: () => { this.notice.set(`${this.sectionLabels[section]} visibility updated.`); this.refresh(); },
      error: (e) => this.fail(e, 'Could not change visibility.'),
    });
  }

  // ── Structured list sections (add / remove) ────────────────
  /** Runs an add observable, resets the form, and reloads on success. */
  private addItem(obs: import('rxjs').Observable<unknown>, reset: () => void, label: string): void {
    this.error.set(null);
    obs.subscribe({
      next: () => { reset(); this.notice.set(`${label} added.`); this.refresh(); },
      error: (e) => this.fail(e, `Could not add the ${label.toLowerCase()}.`),
    });
  }

  addPromoter(): void {
    if (!this.newPromoter.name) { this.error.set('A promoter needs a name.'); return; }
    this.addItem(
      this.content.addPromoter({
        name: this.newPromoter.name,
        background: this.newPromoter.background || undefined,
        shareholdingPct: this.newPromoter.shareholdingPct ?? undefined,
        priorExperience: this.newPromoter.priorExperience || undefined,
      }),
      () => (this.newPromoter = { name: '', background: '', shareholdingPct: null, priorExperience: '' }),
      'Promoter',
    );
  }
  removePromoter(id: string): void {
    this.content.removePromoter(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addGroupCompany(): void {
    if (!this.newGroupCompany.name) { this.error.set('A group company needs a name.'); return; }
    this.addItem(
      this.content.addGroupCompany({
        name: this.newGroupCompany.name,
        relationship: this.newGroupCompany.relationship || undefined,
        ownershipPct: this.newGroupCompany.ownershipPct ?? undefined,
      }),
      () => (this.newGroupCompany = { name: '', relationship: '', ownershipPct: null }),
      'Group company',
    );
  }
  removeGroupCompany(id: string): void {
    this.content.removeGroupCompany(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addProdSvc(): void {
    if (!this.newProdSvc.name) { this.error.set('A product/service needs a name.'); return; }
    this.addItem(
      this.content.addProductService({
        name: this.newProdSvc.name,
        description: this.newProdSvc.description || undefined,
        category: this.newProdSvc.category || undefined,
      }),
      () => (this.newProdSvc = { name: '', description: '', category: '' }),
      'Product / service',
    );
  }
  removeProdSvc(id: string): void {
    this.content.removeProductService(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addCompetitor(): void {
    if (!this.newCompetitor.name) { this.error.set('A competitor needs a name.'); return; }
    this.addItem(
      this.content.addCompetitor({
        name: this.newCompetitor.name,
        differentiation: this.newCompetitor.differentiation || undefined,
      }),
      () => (this.newCompetitor = { name: '', differentiation: '' }),
      'Competitor',
    );
  }
  removeCompetitor(id: string): void {
    this.content.removeCompetitor(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addSwot(): void {
    if (!this.newSwot.text) { this.error.set('A SWOT entry needs some text.'); return; }
    this.addItem(
      this.content.addSwot({ category: this.newSwot.category, text: this.newSwot.text }),
      () => (this.newSwot = { category: 'STRENGTH', text: '' }),
      'SWOT entry',
    );
  }
  removeSwot(id: string): void {
    this.content.removeSwot(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }
  swotOf(category: SwotCategory) {
    return (this.sections()?.swotItems ?? []).filter((s) => s.category === category);
  }

  addRisk(): void {
    if (!this.newRisk.title) { this.error.set('A risk needs a title.'); return; }
    this.addItem(
      this.content.addRisk({
        title: this.newRisk.title,
        description: this.newRisk.description || undefined,
        severity: this.newRisk.severity || undefined,
      }),
      () => (this.newRisk = { title: '', description: '', severity: '' }),
      'Risk',
    );
  }
  removeRisk(id: string): void {
    this.content.removeRisk(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addPlan(): void {
    if (!this.newPlan.title) { this.error.set('A plan needs a title.'); return; }
    this.addItem(
      this.content.addFuturePlan({
        title: this.newPlan.title,
        description: this.newPlan.description || undefined,
        timeframe: this.newPlan.timeframe || undefined,
      }),
      () => (this.newPlan = { title: '', description: '', timeframe: '' }),
      'Future plan',
    );
  }
  removePlan(id: string): void {
    this.content.removeFuturePlan(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addPeer(): void {
    if (!this.newPeer.peerName) { this.error.set('A peer needs a name.'); return; }
    this.addItem(
      this.content.addBenchmarkPeer({
        peerName: this.newPeer.peerName,
        arr: this.newPeer.arr ?? undefined,
        growthPct: this.newPeer.growthPct ?? undefined,
        grossMarginPct: this.newPeer.grossMarginPct ?? undefined,
        note: this.newPeer.note || undefined,
      }),
      () => (this.newPeer = { peerName: '', arr: null, growthPct: null, grossMarginPct: null, note: '' }),
      'Benchmark peer',
    );
  }
  removePeer(id: string): void {
    this.content.removeBenchmarkPeer(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  // ── Classification / funding requirement / operations ──────
  toggleNature(value: NatureOfBusiness): void {
    const cur = this.meta.natureOfBusiness;
    this.meta.natureOfBusiness = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
  }
  isNature(value: NatureOfBusiness): boolean {
    return this.meta.natureOfBusiness.includes(value);
  }

  saveMeta(): void {
    this.error.set(null);
    this.content
      .saveMeta({
        natureOfBusiness: this.meta.natureOfBusiness,
        businessStage: this.meta.businessStage || undefined,
        companyClassification: this.meta.companyClassification || undefined,
        sector: this.meta.sector || undefined,
        fundingRequirementType: this.meta.fundingRequirementType || undefined,
        fundingInstrument: this.meta.fundingInstrument || null,
        fundingUseSummary: this.meta.fundingUseSummary || null,
        fundingSought: this.meta.fundingSought,
        manufacturing: this.meta.manufacturing || null,
        operations: this.meta.operations || null,
      })
      .subscribe({
        next: (s) => { this.sections.set(s); this.notice.set('Saved.'); },
        error: (e) => this.fail(e, 'Could not save.'),
      });
  }

  // ── Shareholding (gated) / customers / suppliers / projected ─
  addShareholder(): void {
    if (!this.newShareholder.name) { this.error.set('A shareholder needs a name.'); return; }
    this.addItem(
      this.content.addShareholder({
        name: this.newShareholder.name,
        shareClass: this.newShareholder.shareClass || undefined,
        percentage: this.newShareholder.percentage ?? undefined,
      }),
      () => (this.newShareholder = { name: '', shareClass: '', percentage: null }),
      'Shareholder',
    );
  }
  removeShareholder(id: string): void {
    this.content.removeShareholder(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addCustomer(): void {
    if (!this.newCustomer.name) { this.error.set('A customer needs a name.'); return; }
    this.addItem(
      this.content.addCustomer({ name: this.newCustomer.name, description: this.newCustomer.description || undefined }),
      () => (this.newCustomer = { name: '', description: '' }),
      'Customer',
    );
  }
  removeCustomer(id: string): void {
    this.content.removeCustomer(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addSupplier(): void {
    if (!this.newSupplier.name) { this.error.set('A supplier needs a name.'); return; }
    this.addItem(
      this.content.addSupplier({ name: this.newSupplier.name, description: this.newSupplier.description || undefined }),
      () => (this.newSupplier = { name: '', description: '' }),
      'Supplier',
    );
  }
  removeSupplier(id: string): void {
    this.content.removeSupplier(id).subscribe({ next: () => this.refresh(), error: () => undefined });
  }

  addProjected(): void {
    if (!this.newProjected.periodLabel) { this.error.set('A projection needs a period label.'); return; }
    this.addItem(
      this.content.addProjectedFinancial({
        periodLabel: this.newProjected.periodLabel,
        revenue: this.newProjected.revenue ?? undefined,
        ebitda: this.newProjected.ebitda ?? undefined,
        note: this.newProjected.note || undefined,
      }),
      () => (this.newProjected = { periodLabel: '', revenue: null, ebitda: null, note: '' }),
      'Projection',
    );
  }
  removeProjected(id: string): void {
    this.content.removeProjectedFinancial(id).subscribe({ next: () => this.refresh(), error: () => undefined });
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
