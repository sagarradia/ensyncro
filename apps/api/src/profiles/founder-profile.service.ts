import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DataRoomVisibility,
  MediaKind,
  ProfileSection,
  Role,
  UploadStatus,
  VideoProvider,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorage } from '../data-room/storage.service';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { buildEmbedUrl, buildWatchUrl, parsePitchVideoUrl } from './pitch-video';
import {
  CreateBenchmarkPeerDto,
  CreateCompetitorDto,
  CreateFuturePlanDto,
  CreateGroupCompanyDto,
  CreateProductServiceDto,
  CreatePromoterDto,
  CreateRiskItemDto,
  CreateSwotItemDto,
} from './dto/deep-profile.dto';
import {
  CreateNamedItemDto,
  CreateProjectedFinancialDto,
  CreateShareholderDto,
  UpdateInvesteeMetaDto,
} from './dto/investee-scope.dto';

/**
 * Long enough that a logo or an uploaded video does not expire while the page
 * is still open. These links are unguessable and single-object; the short TTL
 * used for data room documents would break playback mid-video.
 */
const MEDIA_URL_TTL_SECONDS = 2 * 60 * 60;

@Injectable()
export class FounderProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorage,
  ) {}

  private async ownProfile(user: AccessTokenPayload) {
    const profile = await this.prisma.founderProfile.findUnique({
      where: { userId: user.sub },
    });
    if (!profile) {
      throw new NotFoundException('Complete your company profile first');
    }
    return profile;
  }

  /**
   * Confirms a file id really belongs to this founder and is the right kind,
   * so a founder cannot point their logo at someone else's private document
   * and have the product page serve it.
   */
  private async assertOwnedFile(userId: string, fileId: string, kind: MediaKind) {
    const file = await this.prisma.dataRoomFile.findFirst({
      where: { id: fileId, ownerId: userId, kind, status: UploadStatus.READY },
      select: { id: true },
    });
    if (!file) throw new BadRequestException('That file does not exist in your uploads');
    return file;
  }

  // ── Media ──────────────────────────────────────────────────────

  async updateMedia(
    user: AccessTokenPayload,
    dto: { pitchVideoUrl?: string | null; pitchVideoFileId?: string | null; website?: string | null },
  ) {
    await this.ownProfile(user);

    const data: {
      website?: string | null;
      pitchVideoProvider?: VideoProvider | null;
      pitchVideoId?: string | null;
      pitchVideoFileId?: string | null;
    } = {};

    if (dto.website !== undefined) data.website = dto.website || null;

    // A video is either a link or an upload. Setting one clears the other, so
    // the profile can never present two competing pitch videos.
    if (dto.pitchVideoUrl !== undefined) {
      if (!dto.pitchVideoUrl) {
        data.pitchVideoProvider = null;
        data.pitchVideoId = null;
      } else {
        const parsed = parsePitchVideoUrl(dto.pitchVideoUrl);
        if (!parsed) {
          throw new BadRequestException(
            'Enter a YouTube, Vimeo or Loom video link (e.g. https://youtu.be/…)',
          );
        }
        data.pitchVideoProvider = parsed.provider;
        data.pitchVideoId = parsed.videoId;
        data.pitchVideoFileId = null;
      }
    }

    if (dto.pitchVideoFileId !== undefined) {
      if (!dto.pitchVideoFileId) {
        data.pitchVideoFileId = null;
      } else {
        await this.assertOwnedFile(user.sub, dto.pitchVideoFileId, MediaKind.PITCH_VIDEO);
        data.pitchVideoFileId = dto.pitchVideoFileId;
        data.pitchVideoProvider = null;
        data.pitchVideoId = null;
      }
    }

    await this.prisma.founderProfile.update({ where: { userId: user.sub }, data });
    return this.mediaFor(user.sub);
  }

  /** The founder's own media, with playable URLs resolved. */
  async mediaFor(userId: string) {
    const p = await this.prisma.founderProfile.findUniqueOrThrow({
      where: { userId },
      select: {
        website: true,
        pitchVideoProvider: true,
        pitchVideoId: true,
        pitchVideoFileId: true,
        pitchVideoFile: { select: { id: true, fileName: true, contentType: true, sizeBytes: true } },
      },
    });
    return {
      website: p.website,
      video: await this.resolveVideo(p),
    };
  }

  private async resolveVideo(p: {
    pitchVideoProvider: VideoProvider | null;
    pitchVideoId: string | null;
    pitchVideoFile: { id: string; fileName: string; contentType: string | null } | null;
  }) {
    if (p.pitchVideoProvider && p.pitchVideoId) {
      return {
        source: 'link' as const,
        provider: p.pitchVideoProvider,
        embedUrl: buildEmbedUrl(p.pitchVideoProvider, p.pitchVideoId),
        watchUrl: buildWatchUrl(p.pitchVideoProvider, p.pitchVideoId),
      };
    }
    if (p.pitchVideoFile) {
      const url = await this.storage.presign(
        p.pitchVideoFile.id,
        p.pitchVideoFile.fileName,
        p.pitchVideoFile.contentType,
        MEDIA_URL_TTL_SECONDS,
      );
      // Falls back to the audited data room route when storage cannot presign.
      return {
        source: 'upload' as const,
        fileName: p.pitchVideoFile.fileName,
        playbackUrl: url,
      };
    }
    return null;
  }

  // ── Public product page ────────────────────────────────────────

  async updateProduct(
    user: AccessTokenPayload,
    dto: {
      productName?: string | null;
      tagline?: string | null;
      productDescription?: string | null;
      categories?: string[];
      logoFileId?: string | null;
      usp?: string | null;
      businessModel?: string | null;
      marketSize?: string | null;
      targetSegment?: string | null;
      marketGeography?: string | null;
    },
  ) {
    await this.ownProfile(user);

    if (dto.logoFileId) {
      await this.assertOwnedFile(user.sub, dto.logoFileId, MediaKind.LOGO);
    }

    // Nullable free-text fields: an explicit key means "set it" (empty → null).
    const textField = (key: keyof typeof dto) =>
      dto[key] !== undefined ? { [key]: (dto[key] as string) || null } : {};

    await this.prisma.founderProfile.update({
      where: { userId: user.sub },
      data: {
        ...textField('productName'),
        ...textField('tagline'),
        ...textField('productDescription'),
        ...textField('usp'),
        ...textField('businessModel'),
        ...textField('marketSize'),
        ...textField('targetSegment'),
        ...textField('marketGeography'),
        ...(dto.categories !== undefined
          ? { categories: dto.categories.map((c) => c.trim()).filter(Boolean).slice(0, 12) }
          : {}),
        ...(dto.logoFileId !== undefined ? { logoFileId: dto.logoFileId || null } : {}),
      },
    });
    return this.productPage(user.sub, user);
  }

  /**
   * The ungated product page: what any signed-in user may see. Financials and
   * funding history are deliberately NOT part of this payload — they are
   * fetched separately so that each view can be authorised and audited.
   */
  async productPage(founderUserId: string, viewer: AccessTokenPayload) {
    const p = await this.prisma.founderProfile.findUnique({
      where: { userId: founderUserId },
      select: {
        id: true,
        userId: true,
        companyName: true,
        sector: true,
        stage: true,
        fundingSought: true,
        description: true,
        website: true,
        location: true,
        teamSize: true,
        productName: true,
        tagline: true,
        productDescription: true,
        categories: true,
        // Public structured detail.
        usp: true,
        businessModel: true,
        marketSize: true,
        targetSegment: true,
        marketGeography: true,
        // Classification + funding requirement + operations (public).
        natureOfBusiness: true,
        businessStage: true,
        companyClassification: true,
        fundingRequirementType: true,
        fundingInstrument: true,
        fundingUseSummary: true,
        manufacturing: true,
        operations: true,
        financialsVisibility: true,
        fundingHistoryVisibility: true,
        risksVisibility: true,
        futurePlansVisibility: true,
        shareholdingVisibility: true,
        projectedFinancialsVisibility: true,
        pitchVideoProvider: true,
        pitchVideoId: true,
        logoFile: { select: { id: true, fileName: true, contentType: true } },
        pitchVideoFile: { select: { id: true, fileName: true, contentType: true } },
        promoters: { orderBy: { createdAt: 'asc' } },
        groupCompanies: { orderBy: { createdAt: 'asc' } },
        productsServices: { orderBy: { createdAt: 'asc' } },
        competitors: { orderBy: { createdAt: 'asc' } },
        swotItems: { orderBy: { createdAt: 'asc' } },
        keyCustomers: { orderBy: { createdAt: 'asc' } },
        suppliers: { orderBy: { createdAt: 'asc' } },
        // Company Journey — reuses the milestones timeline, public here.
        milestones: { orderBy: { occurredOn: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException('Founder not found');

    const logoUrl = p.logoFile
      ? await this.storage.presign(
          p.logoFile.id,
          p.logoFile.fileName,
          p.logoFile.contentType,
          MEDIA_URL_TTL_SECONDS,
        )
      : null;

    const {
      logoFile,
      pitchVideoFile,
      financialsVisibility,
      fundingHistoryVisibility,
      risksVisibility,
      futurePlansVisibility,
      shareholdingVisibility,
      projectedFinancialsVisibility,
      milestones,
      ...rest
    } = p;

    return {
      ...rest,
      logoUrl,
      video: await this.resolveVideo(p),
      journey: milestones,
      // Lets the UI show a locked state instead of discovering the block by
      // firing a request that 404s.
      access: {
        financials: this.mayView(financialsVisibility, p.userId, viewer),
        fundingHistory: this.mayView(fundingHistoryVisibility, p.userId, viewer),
        risks: this.mayView(risksVisibility, p.userId, viewer),
        futurePlans: this.mayView(futurePlansVisibility, p.userId, viewer),
        shareholding: this.mayView(shareholdingVisibility, p.userId, viewer),
        projectedFinancials: this.mayView(projectedFinancialsVisibility, p.userId, viewer),
      },
    };
  }

  // ── Gated sections ─────────────────────────────────────────────

  /** Mirrors the data room's rule so gating behaves the same everywhere. */
  private mayView(
    visibility: DataRoomVisibility,
    founderUserId: string,
    viewer: AccessTokenPayload,
  ): boolean {
    if (viewer.sub === founderUserId) return true;
    if (viewer.role === Role.ADMIN) return true;
    return (
      viewer.role === Role.INVESTOR && visibility === DataRoomVisibility.VISIBLE_TO_INVESTORS
    );
  }

  /** Maps each gated section to the profile column that governs it. */
  private static readonly VISIBILITY_FIELD: Record<
    ProfileSection,
    | 'financialsVisibility'
    | 'fundingHistoryVisibility'
    | 'risksVisibility'
    | 'futurePlansVisibility'
    | 'shareholdingVisibility'
    | 'projectedFinancialsVisibility'
  > = {
    [ProfileSection.FINANCIALS]: 'financialsVisibility',
    [ProfileSection.FUNDING_HISTORY]: 'fundingHistoryVisibility',
    [ProfileSection.RISKS]: 'risksVisibility',
    [ProfileSection.FUTURE_PLANS]: 'futurePlansVisibility',
    [ProfileSection.SHAREHOLDING]: 'shareholdingVisibility',
    [ProfileSection.PROJECTED_FINANCIALS]: 'projectedFinancialsVisibility',
  };

  private async gate(founderUserId: string, viewer: AccessTokenPayload, section: ProfileSection) {
    const profile = await this.prisma.founderProfile.findUnique({
      where: { userId: founderUserId },
      select: {
        id: true,
        userId: true,
        financialsVisibility: true,
        fundingHistoryVisibility: true,
        risksVisibility: true,
        futurePlansVisibility: true,
        shareholdingVisibility: true,
        projectedFinancialsVisibility: true,
      },
    });
    // Same answer for "no such founder" and "not shared with you", so the
    // endpoint cannot be used to discover who is on the platform.
    if (!profile) throw new NotFoundException('Not found');

    const visibility = profile[FounderProfileService.VISIBILITY_FIELD[section]];

    if (!this.mayView(visibility, profile.userId, viewer)) {
      throw new NotFoundException('Not found');
    }

    // Audit only other people's views — a founder does not need a log of
    // themselves opening their own page.
    if (viewer.sub !== profile.userId) {
      await this.prisma.profileSectionAccessLog.create({
        data: { founderId: profile.userId, viewerId: viewer.sub, section },
      });
    }
    return profile;
  }

  async financials(founderUserId: string, viewer: AccessTokenPayload) {
    const { id } = await this.gate(founderUserId, viewer, ProfileSection.FINANCIALS);
    const p = await this.prisma.founderProfile.findUniqueOrThrow({
      where: { id },
      select: {
        mrr: true,
        arr: true,
        monthlyBurn: true,
        runwayMonths: true,
        useOfFunds: true,
        annualRevenue: true,
        grossMarginPct: true,
        cashBalance: true,
        priorYearArr: true,
        teamSize: true,
        financialsVisibility: true,
        benchmarkPeers: { orderBy: { createdAt: 'asc' } },
      },
    });
    // Milestones moved to the public Company Journey section; financials is now
    // purely the numbers, their ratios and peer benchmarking.
    const { teamSize, ...rest } = p;
    return { ...rest, ratios: this.computeRatios(p) };
  }

  /**
   * Ratios derived from the raw inputs — only those we have enough data for are
   * returned, so the UI shows exactly what the founder has filled in.
   */
  private computeRatios(f: {
    arr: number | null;
    mrr: number | null;
    monthlyBurn: number | null;
    annualRevenue: number | null;
    cashBalance: number | null;
    priorYearArr: number | null;
    teamSize: number | null;
  }): Record<string, number> {
    const r: Record<string, number> = {};
    if (f.arr != null && f.priorYearArr != null && f.priorYearArr > 0) {
      r.arrGrowthPct = Math.round(((f.arr - f.priorYearArr) / f.priorYearArr) * 100);
    }
    if (f.cashBalance != null && f.monthlyBurn != null && f.monthlyBurn > 0) {
      r.runwayMonthsFromCash = Math.round(f.cashBalance / f.monthlyBurn);
    }
    if (f.annualRevenue != null && f.teamSize != null && f.teamSize > 0) {
      r.revenuePerEmployee = Math.round(f.annualRevenue / f.teamSize);
    }
    const netNewArr = f.arr != null && f.priorYearArr != null ? f.arr - f.priorYearArr : null;
    if (netNewArr != null && netNewArr > 0 && f.monthlyBurn != null) {
      r.burnMultiple = Math.round(((f.monthlyBurn * 12) / netNewArr) * 100) / 100;
    }
    if (f.arr != null && f.mrr != null && f.mrr > 0) {
      r.arrToMrrMultiple = Math.round((f.arr / f.mrr) * 10) / 10;
    }
    return r;
  }

  async fundingHistory(founderUserId: string, viewer: AccessTokenPayload) {
    const { id } = await this.gate(founderUserId, viewer, ProfileSection.FUNDING_HISTORY);
    const rounds = await this.prisma.fundingRound.findMany({
      where: { founderId: id },
      orderBy: { closedOn: 'desc' },
    });
    const totalRaised = rounds.reduce((sum, r) => sum + r.amountRaised, 0);
    return { rounds, totalRaised };
  }

  // ── Owner writes ───────────────────────────────────────────────

  async updateFinancials(
    user: AccessTokenPayload,
    dto: {
      mrr?: number | null;
      arr?: number | null;
      monthlyBurn?: number | null;
      runwayMonths?: number | null;
      useOfFunds?: string | null;
      annualRevenue?: number | null;
      grossMarginPct?: number | null;
      cashBalance?: number | null;
      priorYearArr?: number | null;
      financialsVisibility?: DataRoomVisibility;
    },
  ) {
    await this.ownProfile(user);
    await this.prisma.founderProfile.update({ where: { userId: user.sub }, data: dto });
    return this.financials(user.sub, user);
  }

  async setSectionVisibility(
    user: AccessTokenPayload,
    section: ProfileSection,
    visibility: DataRoomVisibility,
  ) {
    await this.ownProfile(user);
    await this.prisma.founderProfile.update({
      where: { userId: user.sub },
      data: { [FounderProfileService.VISIBILITY_FIELD[section]]: visibility },
    });
    return { section, visibility };
  }

  async addMilestone(
    user: AccessTokenPayload,
    dto: { title: string; description?: string; occurredOn: string; achieved?: boolean },
  ) {
    const profile = await this.ownProfile(user);
    return this.prisma.founderMilestone.create({
      data: {
        founderId: profile.id,
        title: dto.title,
        description: dto.description ?? null,
        occurredOn: new Date(dto.occurredOn),
        achieved: dto.achieved ?? false,
      },
    });
  }

  async removeMilestone(user: AccessTokenPayload, id: string) {
    const profile = await this.ownProfile(user);
    const { count } = await this.prisma.founderMilestone.deleteMany({
      where: { id, founderId: profile.id },
    });
    if (!count) throw new NotFoundException('Milestone not found');
    return { id, deleted: true };
  }

  async addFundingRound(
    user: AccessTokenPayload,
    dto: {
      stage: import('@prisma/client').FundingStage;
      amountRaised: number;
      preMoney?: number;
      postMoney?: number;
      closedOn: string;
      leadInvestor?: string;
    },
  ) {
    const profile = await this.ownProfile(user);
    return this.prisma.fundingRound.create({
      data: {
        founderId: profile.id,
        stage: dto.stage,
        amountRaised: dto.amountRaised,
        preMoney: dto.preMoney ?? null,
        postMoney: dto.postMoney ?? null,
        closedOn: new Date(dto.closedOn),
        leadInvestor: dto.leadInvestor ?? null,
      },
    });
  }

  async removeFundingRound(user: AccessTokenPayload, id: string) {
    const profile = await this.ownProfile(user);
    const { count } = await this.prisma.fundingRound.deleteMany({
      where: { id, founderId: profile.id },
    });
    if (!count) throw new NotFoundException('Funding round not found');
    return { id, deleted: true };
  }

  // ── Deep profile: owner reads everything ───────────────────────

  /** Everything the founder needs to edit their structured profile. */
  async ownSections(user: AccessTokenPayload) {
    const p = await this.prisma.founderProfile.findUnique({
      where: { userId: user.sub },
      select: {
        companyName: true,
        sector: true,
        description: true,
        usp: true,
        businessModel: true,
        marketSize: true,
        targetSegment: true,
        marketGeography: true,
        // Classification + funding requirement + operations (public meta).
        natureOfBusiness: true,
        businessStage: true,
        companyClassification: true,
        fundingRequirementType: true,
        fundingInstrument: true,
        fundingUseSummary: true,
        fundingSought: true,
        manufacturing: true,
        operations: true,
        // Gating for the two new sensitive sections.
        risksVisibility: true,
        futurePlansVisibility: true,
        shareholdingVisibility: true,
        projectedFinancialsVisibility: true,
        // Fields the completion score inspects.
        mrr: true,
        logoFileId: true,
        pitchVideoId: true,
        pitchVideoFileId: true,
        promoters: { orderBy: { createdAt: 'asc' } },
        groupCompanies: { orderBy: { createdAt: 'asc' } },
        productsServices: { orderBy: { createdAt: 'asc' } },
        competitors: { orderBy: { createdAt: 'asc' } },
        swotItems: { orderBy: { createdAt: 'asc' } },
        riskItems: { orderBy: { createdAt: 'asc' } },
        futurePlanItems: { orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { occurredOn: 'asc' } },
        shareholders: { orderBy: { percentage: 'desc' } },
        keyCustomers: { orderBy: { createdAt: 'asc' } },
        suppliers: { orderBy: { createdAt: 'asc' } },
        projectedFinancials: { orderBy: { periodLabel: 'asc' } },
        _count: {
          select: {
            promoters: true,
            groupCompanies: true,
            productsServices: true,
            competitors: true,
            swotItems: true,
            milestones: true,
            riskItems: true,
            futurePlanItems: true,
            benchmarkPeers: true,
            shareholders: true,
            keyCustomers: true,
            suppliers: true,
            projectedFinancials: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Complete your company profile first');

    const completionScore = this.computeCompletionScore(p);
    // Expose the milestones list under the name the UI uses for it, and drop
    // the fields that were only selected to feed the completion score.
    const { milestones, _count, companyName, description, mrr, logoFileId, pitchVideoId, pitchVideoFileId, ...rest } = p;
    return { ...rest, journey: milestones, completionScore };
  }

  // ── Deep profile: gated section reads (audited) ────────────────

  async risks(founderUserId: string, viewer: AccessTokenPayload) {
    const { id } = await this.gate(founderUserId, viewer, ProfileSection.RISKS);
    const items = await this.prisma.riskItem.findMany({
      where: { founderId: id },
      orderBy: { createdAt: 'asc' },
    });
    return { items };
  }

  async futurePlans(founderUserId: string, viewer: AccessTokenPayload) {
    const { id } = await this.gate(founderUserId, viewer, ProfileSection.FUTURE_PLANS);
    const items = await this.prisma.futurePlan.findMany({
      where: { founderId: id },
      orderBy: { createdAt: 'asc' },
    });
    return { items };
  }

  // ── Deep profile: list CRUD ────────────────────────────────────
  // Every child row is scoped to the caller's own profile on both create and
  // delete, so a founder can only ever touch their own structured data.

  private async removeChild(
    user: AccessTokenPayload,
    deleteMany: (founderId: string) => Promise<{ count: number }>,
  ) {
    const profile = await this.ownProfile(user);
    const { count } = await deleteMany(profile.id);
    if (!count) throw new NotFoundException('Not found');
    return { deleted: true };
  }

  async addPromoter(user: AccessTokenPayload, dto: CreatePromoterDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.promoter.create({ data: { founderId: profile.id, ...dto } });
  }
  removePromoter(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.promoter.deleteMany({ where: { id, founderId } }),
    );
  }

  async addGroupCompany(user: AccessTokenPayload, dto: CreateGroupCompanyDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.groupCompany.create({ data: { founderId: profile.id, ...dto } });
  }
  removeGroupCompany(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.groupCompany.deleteMany({ where: { id, founderId } }),
    );
  }

  async addProductService(user: AccessTokenPayload, dto: CreateProductServiceDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.productService.create({ data: { founderId: profile.id, ...dto } });
  }
  removeProductService(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.productService.deleteMany({ where: { id, founderId } }),
    );
  }

  async addCompetitor(user: AccessTokenPayload, dto: CreateCompetitorDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.competitor.create({ data: { founderId: profile.id, ...dto } });
  }
  removeCompetitor(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.competitor.deleteMany({ where: { id, founderId } }),
    );
  }

  async addSwotItem(user: AccessTokenPayload, dto: CreateSwotItemDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.swotItem.create({ data: { founderId: profile.id, ...dto } });
  }
  removeSwotItem(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.swotItem.deleteMany({ where: { id, founderId } }),
    );
  }

  async addRiskItem(user: AccessTokenPayload, dto: CreateRiskItemDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.riskItem.create({ data: { founderId: profile.id, ...dto } });
  }
  removeRiskItem(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.riskItem.deleteMany({ where: { id, founderId } }),
    );
  }

  async addFuturePlan(user: AccessTokenPayload, dto: CreateFuturePlanDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.futurePlan.create({ data: { founderId: profile.id, ...dto } });
  }
  removeFuturePlan(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.futurePlan.deleteMany({ where: { id, founderId } }),
    );
  }

  async addBenchmarkPeer(user: AccessTokenPayload, dto: CreateBenchmarkPeerDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.benchmarkPeer.create({ data: { founderId: profile.id, ...dto } });
  }
  removeBenchmarkPeer(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.benchmarkPeer.deleteMany({ where: { id, founderId } }),
    );
  }

  // ── Broader Investee scope (PRD v2 §7/§8) ──────────────────────

  /** Classification / funding requirement / operations — public scalar meta. */
  async updateMeta(user: AccessTokenPayload, dto: UpdateInvesteeMetaDto) {
    await this.ownProfile(user);
    const data: Record<string, unknown> = {};
    if (dto.natureOfBusiness !== undefined) data['natureOfBusiness'] = dto.natureOfBusiness;
    if (dto.businessStage !== undefined) data['businessStage'] = dto.businessStage;
    if (dto.companyClassification !== undefined) data['companyClassification'] = dto.companyClassification;
    if (dto.sector) data['sector'] = dto.sector;
    if (dto.fundingRequirementType !== undefined) data['fundingRequirementType'] = dto.fundingRequirementType;
    if (dto.fundingSought !== undefined) data['fundingSought'] = dto.fundingSought;
    if (dto.fundingInstrument !== undefined) data['fundingInstrument'] = dto.fundingInstrument || null;
    if (dto.fundingUseSummary !== undefined) data['fundingUseSummary'] = dto.fundingUseSummary || null;
    if (dto.manufacturing !== undefined) data['manufacturing'] = dto.manufacturing || null;
    if (dto.operations !== undefined) data['operations'] = dto.operations || null;
    await this.prisma.founderProfile.update({ where: { userId: user.sub }, data });
    return this.ownSections(user);
  }

  /** Admin-managed sector master list (§8) — read for the editor dropdown. */
  sectors() {
    return this.prisma.sectorMaster.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    });
  }

  async addShareholder(user: AccessTokenPayload, dto: CreateShareholderDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.shareholder.create({ data: { founderId: profile.id, ...dto } });
  }
  removeShareholder(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.shareholder.deleteMany({ where: { id, founderId } }),
    );
  }

  async addCustomer(user: AccessTokenPayload, dto: CreateNamedItemDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.keyCustomer.create({ data: { founderId: profile.id, ...dto } });
  }
  removeCustomer(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.keyCustomer.deleteMany({ where: { id, founderId } }),
    );
  }

  async addSupplier(user: AccessTokenPayload, dto: CreateNamedItemDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.supplier.create({ data: { founderId: profile.id, ...dto } });
  }
  removeSupplier(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.supplier.deleteMany({ where: { id, founderId } }),
    );
  }

  async addProjectedFinancial(user: AccessTokenPayload, dto: CreateProjectedFinancialDto) {
    const profile = await this.ownProfile(user);
    return this.prisma.projectedFinancial.create({ data: { founderId: profile.id, ...dto } });
  }
  removeProjectedFinancial(user: AccessTokenPayload, id: string) {
    return this.removeChild(user, (founderId) =>
      this.prisma.projectedFinancial.deleteMany({ where: { id, founderId } }),
    );
  }

  // Gated reads (audited), mirroring risks/financials.
  async shareholding(founderUserId: string, viewer: AccessTokenPayload) {
    const { id } = await this.gate(founderUserId, viewer, ProfileSection.SHAREHOLDING);
    const items = await this.prisma.shareholder.findMany({
      where: { founderId: id },
      orderBy: { percentage: 'desc' },
    });
    return { items };
  }

  async projectedFinancialsFor(founderUserId: string, viewer: AccessTokenPayload) {
    const { id } = await this.gate(founderUserId, viewer, ProfileSection.PROJECTED_FINANCIALS);
    const items = await this.prisma.projectedFinancial.findMany({
      where: { founderId: id },
      orderBy: { periodLabel: 'asc' },
    });
    return { items };
  }

  /**
   * A simple weighted completeness score across the whole profile — a nudge for
   * the founder, not gated and not shown to viewers. Each filled section counts
   * once towards the total.
   */
  private computeCompletionScore(p: {
    companyName: string | null;
    sector: string | null;
    description: string | null;
    businessStage: unknown;
    companyClassification: unknown;
    natureOfBusiness: unknown[];
    usp: string | null;
    businessModel: string | null;
    marketSize: string | null;
    fundingRequirementType: unknown;
    manufacturing: string | null;
    operations: string | null;
    mrr: number | null;
    logoFileId: string | null;
    pitchVideoId: string | null;
    pitchVideoFileId: string | null;
    _count: Record<string, number>;
  }): number {
    const c = p._count;
    const checks: boolean[] = [
      !!p.companyName,
      !!p.sector,
      !!p.description,
      !!p.businessStage,
      !!p.companyClassification,
      p.natureOfBusiness.length > 0,
      !!p.usp,
      !!p.businessModel,
      !!p.marketSize,
      !!p.fundingRequirementType,
      !!p.manufacturing,
      !!p.operations,
      p.mrr != null,
      !!p.logoFileId,
      !!(p.pitchVideoId || p.pitchVideoFileId),
      c.promoters > 0,
      c.groupCompanies > 0,
      c.productsServices > 0,
      c.competitors > 0,
      c.swotItems > 0,
      c.milestones > 0,
      c.riskItems > 0,
      c.futurePlanItems > 0,
      c.benchmarkPeers > 0,
      c.shareholders > 0,
      c.keyCustomers > 0,
      c.suppliers > 0,
      c.projectedFinancials > 0,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }

  /** Task #13 equivalent for profile sections: who opened what. */
  sectionAccessLog(user: AccessTokenPayload) {
    return this.prisma.profileSectionAccessLog.findMany({
      where: { founderId: user.sub },
      orderBy: { viewedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        section: true,
        viewedAt: true,
        viewer: { select: { id: true, email: true, role: true } },
      },
    });
  }
}
