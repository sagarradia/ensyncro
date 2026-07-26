import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BusinessStage,
  CompanyClassification,
  FundingRequirementType,
  FundingStage,
  NatureOfBusiness,
  RiskSeverity,
  SwotCategory,
} from '@prisma/client';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { FounderProfileService } from '../profiles/founder-profile.service';
import { DocBlock, PdfDocModel, PdfService } from './pdf.service';

const STAGE_LABEL: Record<FundingStage, string> = {
  IDEA: 'Idea',
  PRE_SEED: 'Pre-seed',
  SEED: 'Seed',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C_PLUS: 'Series C+',
};

const NATURE_LABEL: Record<NatureOfBusiness, string> = {
  MANUFACTURING: 'Manufacturing',
  TRADING: 'Trading',
  SERVICE: 'Service',
};

const BUSINESS_STAGE_LABEL: Record<BusinessStage, string> = {
  IDEA: 'Idea',
  STARTUP: 'Startup',
  EARLY_REVENUE: 'Early revenue',
  GROWTH: 'Growth',
  EXPANSION: 'Expansion',
  MATURE: 'Mature',
  TURNAROUND: 'Turnaround',
};

const CLASSIFICATION_LABEL: Record<CompanyClassification, string> = {
  MSME: 'MSME',
  LARGE_ENTERPRISE: 'Large enterprise',
  LISTED: 'Listed',
  UNLISTED: 'Unlisted',
  GOVERNMENT: 'Government',
  PSU: 'PSU',
};

const FUNDING_TYPE_LABEL: Record<FundingRequirementType, string> = {
  SEED: 'Seed',
  ANGEL: 'Angel',
  GROWTH: 'Growth',
  EXPANSION: 'Expansion',
  BRIDGE: 'Bridge',
  PRE_IPO: 'Pre-IPO',
  STRATEGIC: 'Strategic',
  ACQUISITION: 'Acquisition',
};

const SEVERITY_LABEL: Record<RiskSeverity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const SWOT_LABEL: Record<SwotCategory, string> = {
  STRENGTH: 'Strengths',
  WEAKNESS: 'Weaknesses',
  OPPORTUNITY: 'Opportunities',
  THREAT: 'Threats',
};

const SWOT_ORDER: SwotCategory[] = ['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'];

/**
 * Auto-generates the Teaser and the Information Memorandum from a founder's
 * structured profile — the platform's core differentiator (PRD v2 §3, §7). No
 * manual authoring: every line comes from a real profile field. Gating is not
 * re-implemented here; the gated commercial sections are fetched through the
 * exact same {@link FounderProfileService} methods the product page uses, so a
 * viewer who cannot see Financials on the page cannot see them in the IM either
 * — and each such fetch is audited identically.
 */
@Injectable()
export class FounderDocumentsService {
  constructor(
    private readonly founders: FounderProfileService,
    private readonly pdf: PdfService,
  ) {}

  async teaser(founderUserId: string, viewer: AccessTokenPayload): Promise<GeneratedDoc> {
    const p = await this.founders.productPage(founderUserId, viewer);
    // Key metrics only when Financials are shared with this viewer (audited).
    const financials = await this.optional(() => this.founders.financials(founderUserId, viewer));

    const blocks: DocBlock[] = [];

    const pitch = p.tagline || p.usp || p.description;
    if (pitch) blocks.push({ type: 'callout', label: 'One-line pitch', text: pitch });

    blocks.push({ type: 'heading', text: 'Snapshot' });
    blocks.push({
      type: 'keyValues',
      rows: this.compact([
        ['Company', p.companyName],
        ['Product', p.productName],
        ['Sector', p.sector],
        ['Stage', STAGE_LABEL[p.stage]],
        ['Business stage', p.businessStage ? BUSINESS_STAGE_LABEL[p.businessStage] : ''],
        ['Location', p.location],
        ['Team size', p.teamSize != null ? String(p.teamSize) : ''],
        ['Website', p.website],
        ['Categories', (p.categories ?? []).join(', ')],
      ]),
    });

    if (p.productDescription || p.description) {
      blocks.push({ type: 'heading', text: 'What they do' });
      blocks.push({ type: 'paragraph', text: (p.productDescription || p.description)! });
    }

    // Funding sought is public; the ask belongs on a teaser.
    const fundingRows = this.compact([
      ['Funding sought', p.fundingSought != null ? this.money(p.fundingSought) : ''],
      ['Type', p.fundingRequirementType ? FUNDING_TYPE_LABEL[p.fundingRequirementType] : ''],
      ['Instrument', p.fundingInstrument],
      ['Use of funds', p.fundingUseSummary],
    ]);
    if (fundingRows.length) {
      blocks.push({ type: 'heading', text: 'Funding requirement' });
      blocks.push({ type: 'keyValues', rows: fundingRows });
    }

    if (financials) {
      const metrics = this.metricRows(financials);
      if (metrics.length) {
        blocks.push({ type: 'heading', text: 'Key metrics' });
        blocks.push({ type: 'keyValues', rows: metrics });
      }
    }

    return {
      buffer: await this.pdf.render({
        kicker: 'Teaser',
        title: p.companyName,
        subtitle: p.tagline || p.sector,
        footerNote: 'Confidential — shared via Ensyncro',
        blocks,
      }),
      filename: `${this.slug(p.companyName)}-teaser.pdf`,
    };
  }

  async informationMemorandum(
    founderUserId: string,
    viewer: AccessTokenPayload,
  ): Promise<GeneratedDoc> {
    const p = await this.founders.productPage(founderUserId, viewer);
    const blocks: DocBlock[] = [];

    // ── Overview ──────────────────────────────────────────────
    if (p.tagline) blocks.push({ type: 'callout', label: 'One-line pitch', text: p.tagline });
    blocks.push({ type: 'heading', text: 'Company overview' });
    blocks.push({
      type: 'keyValues',
      rows: this.compact([
        ['Company', p.companyName],
        ['Product', p.productName],
        ['Sector', p.sector],
        ['Categories', (p.categories ?? []).join(', ')],
        ['Funding stage', STAGE_LABEL[p.stage]],
        ['Business stage', p.businessStage ? BUSINESS_STAGE_LABEL[p.businessStage] : ''],
        ['Nature of business', (p.natureOfBusiness ?? []).map((n) => NATURE_LABEL[n]).join(', ')],
        ['Classification', p.companyClassification ? CLASSIFICATION_LABEL[p.companyClassification] : ''],
        ['Location', p.location],
        ['Team size', p.teamSize != null ? String(p.teamSize) : ''],
        ['Website', p.website],
      ]),
    });
    if (p.productDescription || p.description) {
      blocks.push({ type: 'paragraph', text: (p.productDescription || p.description)! });
    }

    // ── Product & business ────────────────────────────────────
    if (p.usp) {
      blocks.push({ type: 'heading', text: 'Unique selling proposition' });
      blocks.push({ type: 'paragraph', text: p.usp });
    }
    if (p.businessModel) {
      blocks.push({ type: 'heading', text: 'Business model' });
      blocks.push({ type: 'paragraph', text: p.businessModel });
    }
    if (p.productsServices?.length) {
      blocks.push({ type: 'heading', text: 'Products & services' });
      blocks.push({
        type: 'table',
        columns: ['Name', 'Category', 'Description'],
        rows: p.productsServices.map((s) => [s.name, s.category ?? '—', s.description ?? '—']),
      });
    }

    // ── Market & competition ──────────────────────────────────
    const marketRows = this.compact([
      ['Market size', p.marketSize],
      ['Target segment', p.targetSegment],
      ['Geography', p.marketGeography],
    ]);
    if (marketRows.length) {
      blocks.push({ type: 'heading', text: 'Market' });
      blocks.push({ type: 'keyValues', rows: marketRows });
    }
    if (p.competitors?.length) {
      blocks.push({ type: 'heading', text: 'Competition' });
      blocks.push({
        type: 'table',
        columns: ['Competitor', 'Our differentiation'],
        rows: p.competitors.map((c) => [c.name, c.differentiation ?? '—']),
      });
    }

    // ── SWOT ──────────────────────────────────────────────────
    if (p.swotItems?.length) {
      blocks.push({ type: 'heading', text: 'SWOT analysis' });
      for (const cat of SWOT_ORDER) {
        const items = p.swotItems.filter((s) => s.category === cat);
        if (!items.length) continue;
        blocks.push({ type: 'subheading', text: SWOT_LABEL[cat] });
        blocks.push({ type: 'bullets', items: items.map((s) => s.text) });
      }
    }

    // ── Promoters & group ─────────────────────────────────────
    if (p.promoters?.length) {
      blocks.push({ type: 'heading', text: 'Promoters' });
      blocks.push({
        type: 'table',
        columns: ['Name', 'Holding %', 'Background'],
        rows: p.promoters.map((pr) => [
          pr.name,
          pr.shareholdingPct != null ? `${pr.shareholdingPct}%` : '—',
          pr.background ?? pr.priorExperience ?? '—',
        ]),
      });
    }
    if (p.groupCompanies?.length) {
      blocks.push({ type: 'heading', text: 'Group companies' });
      blocks.push({
        type: 'table',
        columns: ['Name', 'Relationship', 'Ownership %'],
        rows: p.groupCompanies.map((g) => [
          g.name,
          g.relationship ?? '—',
          g.ownershipPct != null ? `${g.ownershipPct}%` : '—',
        ]),
      });
    }

    // ── Customers, suppliers, operations ──────────────────────
    if (p.keyCustomers?.length) {
      blocks.push({ type: 'heading', text: 'Key customers' });
      blocks.push({
        type: 'table',
        columns: ['Customer', 'Detail'],
        rows: p.keyCustomers.map((c) => [c.name, c.description ?? '—']),
      });
    }
    if (p.suppliers?.length) {
      blocks.push({ type: 'heading', text: 'Key suppliers' });
      blocks.push({
        type: 'table',
        columns: ['Supplier', 'Detail'],
        rows: p.suppliers.map((s) => [s.name, s.description ?? '—']),
      });
    }
    if (p.manufacturing || p.operations) {
      blocks.push({ type: 'heading', text: 'Operations' });
      if (p.manufacturing) {
        blocks.push({ type: 'subheading', text: 'Manufacturing' });
        blocks.push({ type: 'paragraph', text: p.manufacturing });
      }
      if (p.operations) {
        blocks.push({ type: 'subheading', text: 'Operations' });
        blocks.push({ type: 'paragraph', text: p.operations });
      }
    }

    // ── Company journey ───────────────────────────────────────
    if (p.journey?.length) {
      blocks.push({ type: 'heading', text: 'Company journey' });
      blocks.push({
        type: 'table',
        columns: ['Date', 'Milestone', 'Status'],
        rows: p.journey.map((m) => [
          this.date(m.occurredOn),
          m.description ? `${m.title} — ${m.description}` : m.title,
          m.achieved ? 'Achieved' : 'Planned',
        ]),
      });
    }

    // ── Funding requirement (public ask) ──────────────────────
    const askRows = this.compact([
      ['Funding sought', p.fundingSought != null ? this.money(p.fundingSought) : ''],
      ['Type', p.fundingRequirementType ? FUNDING_TYPE_LABEL[p.fundingRequirementType] : ''],
      ['Instrument', p.fundingInstrument],
      ['Use of funds', p.fundingUseSummary],
    ]);
    if (askRows.length) {
      blocks.push({ type: 'heading', text: 'Funding requirement' });
      blocks.push({ type: 'keyValues', rows: askRows });
    }

    // ── Gated commercial sections (only if this viewer may see) ─
    const financials = await this.optional(() => this.founders.financials(founderUserId, viewer));
    if (financials) {
      blocks.push({ type: 'heading', text: 'Financials' });
      const rows = this.metricRows(financials);
      if (rows.length) blocks.push({ type: 'keyValues', rows });
      if (financials.useOfFunds) {
        blocks.push({ type: 'subheading', text: 'Use of funds' });
        blocks.push({ type: 'paragraph', text: financials.useOfFunds });
      }
      if (financials.benchmarkPeers?.length) {
        blocks.push({ type: 'subheading', text: 'Benchmarking' });
        blocks.push({
          type: 'table',
          columns: ['Peer', 'ARR', 'Growth %', 'Gross margin %'],
          rows: financials.benchmarkPeers.map((b) => [
            b.peerName,
            b.arr != null ? this.money(b.arr) : '—',
            b.growthPct != null ? `${b.growthPct}%` : '—',
            b.grossMarginPct != null ? `${b.grossMarginPct}%` : '—',
          ]),
        });
      }
    }

    const funding = await this.optional(() => this.founders.fundingHistory(founderUserId, viewer));
    if (funding && funding.rounds.length) {
      blocks.push({ type: 'heading', text: 'Funding history' });
      blocks.push({
        type: 'table',
        columns: ['Closed', 'Stage', 'Raised', 'Post-money', 'Lead'],
        rows: funding.rounds.map((r) => [
          this.date(r.closedOn),
          STAGE_LABEL[r.stage],
          this.money(r.amountRaised),
          r.postMoney != null ? this.money(r.postMoney) : '—',
          r.leadInvestor ?? '—',
        ]),
      });
      blocks.push({ type: 'paragraph', text: `Total raised to date: ${this.money(funding.totalRaised)}.` });
    }

    const shareholding = await this.optional(() => this.founders.shareholding(founderUserId, viewer));
    if (shareholding && shareholding.items.length) {
      blocks.push({ type: 'heading', text: 'Shareholding' });
      blocks.push({
        type: 'table',
        columns: ['Holder', 'Share class', 'Holding %'],
        rows: shareholding.items.map((s) => [
          s.name,
          s.shareClass ?? '—',
          s.percentage != null ? `${s.percentage}%` : '—',
        ]),
      });
    }

    const projected = await this.optional(() =>
      this.founders.projectedFinancialsFor(founderUserId, viewer),
    );
    if (projected && projected.items.length) {
      blocks.push({ type: 'heading', text: 'Projected financials' });
      blocks.push({
        type: 'table',
        columns: ['Period', 'Revenue', 'EBITDA', 'Note'],
        rows: projected.items.map((f) => [
          f.periodLabel,
          f.revenue != null ? this.money(f.revenue) : '—',
          f.ebitda != null ? this.money(f.ebitda) : '—',
          f.note ?? '—',
        ]),
      });
    }

    const risks = await this.optional(() => this.founders.risks(founderUserId, viewer));
    if (risks && risks.items.length) {
      blocks.push({ type: 'heading', text: 'Risks' });
      blocks.push({
        type: 'table',
        columns: ['Risk', 'Severity', 'Mitigation / detail'],
        rows: risks.items.map((r) => [
          r.title,
          r.severity ? SEVERITY_LABEL[r.severity] : '—',
          r.description ?? '—',
        ]),
      });
    }

    const plans = await this.optional(() => this.founders.futurePlans(founderUserId, viewer));
    if (plans && plans.items.length) {
      blocks.push({ type: 'heading', text: 'Future plans' });
      blocks.push({
        type: 'table',
        columns: ['Plan', 'Timeframe', 'Detail'],
        rows: plans.items.map((f) => [f.title, f.timeframe ?? '—', f.description ?? '—']),
      });
    }

    const model: PdfDocModel = {
      kicker: 'Information Memorandum',
      title: p.companyName,
      subtitle: p.tagline || p.sector,
      footerNote: 'Confidential — shared via Ensyncro',
      blocks,
    };
    return {
      buffer: await this.pdf.render(model),
      filename: `${this.slug(p.companyName)}-information-memorandum.pdf`,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Runs a gated fetch and swallows the "not shared" 404 into null, so a
   * section the viewer may not see is simply omitted from the document rather
   * than failing the whole generation. Any other error propagates.
   */
  private async optional<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof NotFoundException) return null;
      throw e;
    }
  }

  private metricRows(f: {
    mrr: number | null;
    arr: number | null;
    monthlyBurn: number | null;
    runwayMonths: number | null;
    annualRevenue: number | null;
    grossMarginPct: number | null;
    cashBalance: number | null;
    priorYearArr: number | null;
    ratios: Record<string, number>;
  }): Array<[string, string]> {
    const r = f.ratios ?? {};
    return this.compact([
      ['MRR', f.mrr != null ? this.money(f.mrr) : ''],
      ['ARR', f.arr != null ? this.money(f.arr) : ''],
      ['Annual revenue', f.annualRevenue != null ? this.money(f.annualRevenue) : ''],
      ['Monthly burn', f.monthlyBurn != null ? this.money(f.monthlyBurn) : ''],
      ['Runway', f.runwayMonths != null ? `${f.runwayMonths} months` : ''],
      ['Cash balance', f.cashBalance != null ? this.money(f.cashBalance) : ''],
      ['Gross margin', f.grossMarginPct != null ? `${f.grossMarginPct}%` : ''],
      ['ARR growth', r.arrGrowthPct != null ? `${r.arrGrowthPct}%` : ''],
      ['Runway (from cash)', r.runwayMonthsFromCash != null ? `${r.runwayMonthsFromCash} months` : ''],
      ['Revenue / employee', r.revenuePerEmployee != null ? this.money(r.revenuePerEmployee) : ''],
      ['Burn multiple', r.burnMultiple != null ? `${r.burnMultiple}x` : ''],
      ['ARR : MRR', r.arrToMrrMultiple != null ? `${r.arrToMrrMultiple}x` : ''],
    ]);
  }

  /** Drops rows whose value is empty, so no "—" noise fills the document. */
  private compact(rows: Array<[string, string | null | undefined]>): Array<[string, string]> {
    return rows.filter((r): r is [string, string] => r[1] != null && r[1] !== '');
  }

  private money(n: number): string {
    return n.toLocaleString('en-IN');
  }

  private date(d: Date | string): string {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private slug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'company'
    );
  }
}

export interface GeneratedDoc {
  buffer: Buffer;
  filename: string;
}
