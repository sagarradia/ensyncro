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
    },
  ) {
    await this.ownProfile(user);

    if (dto.logoFileId) {
      await this.assertOwnedFile(user.sub, dto.logoFileId, MediaKind.LOGO);
    }

    await this.prisma.founderProfile.update({
      where: { userId: user.sub },
      data: {
        ...(dto.productName !== undefined ? { productName: dto.productName || null } : {}),
        ...(dto.tagline !== undefined ? { tagline: dto.tagline || null } : {}),
        ...(dto.productDescription !== undefined
          ? { productDescription: dto.productDescription || null }
          : {}),
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
        financialsVisibility: true,
        fundingHistoryVisibility: true,
        pitchVideoProvider: true,
        pitchVideoId: true,
        logoFile: { select: { id: true, fileName: true, contentType: true } },
        pitchVideoFile: { select: { id: true, fileName: true, contentType: true } },
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

    const { logoFile, pitchVideoFile, financialsVisibility, fundingHistoryVisibility, ...rest } = p;

    return {
      ...rest,
      logoUrl,
      video: await this.resolveVideo(p),
      // Lets the UI show a locked state instead of discovering the block by
      // firing a request that 404s.
      access: {
        financials: this.mayView(financialsVisibility, p.userId, viewer),
        fundingHistory: this.mayView(fundingHistoryVisibility, p.userId, viewer),
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

  private async gate(founderUserId: string, viewer: AccessTokenPayload, section: ProfileSection) {
    const profile = await this.prisma.founderProfile.findUnique({
      where: { userId: founderUserId },
      select: {
        id: true,
        userId: true,
        financialsVisibility: true,
        fundingHistoryVisibility: true,
      },
    });
    // Same answer for "no such founder" and "not shared with you", so the
    // endpoint cannot be used to discover who is on the platform.
    if (!profile) throw new NotFoundException('Not found');

    const visibility =
      section === ProfileSection.FINANCIALS
        ? profile.financialsVisibility
        : profile.fundingHistoryVisibility;

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
        financialsVisibility: true,
        milestones: { orderBy: { occurredOn: 'asc' } },
      },
    });
    return p;
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
      data:
        section === ProfileSection.FINANCIALS
          ? { financialsVisibility: visibility }
          : { fundingHistoryVisibility: visibility },
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
