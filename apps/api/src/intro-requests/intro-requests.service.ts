import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IntroRequestStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload } from '../auth/tokens/token.service';

/**
 * PRD §10: v1 has no threaded messaging. "Request intro" is the whole
 * interaction — one party asks, the other accepts or declines, and contact
 * details are only revealed once accepted.
 */
@Injectable()
export class IntroRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly counterpart: Partial<Record<Role, Role>> = {
    [Role.INVESTOR]: Role.FOUNDER,
    [Role.FOUNDER]: Role.INVESTOR,
  };

  async create(from: AccessTokenPayload, toUserId: string, note?: string) {
    if (toUserId === from.sub) {
      throw new BadRequestException('You cannot request an intro to yourself');
    }

    const expected = this.counterpart[from.role];
    if (!expected) {
      throw new ForbiddenException('Only founders and investors can request intros');
    }

    const to = await this.prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, role: true, status: true },
    });
    // Founders and investors only ever reach each other, so a request aimed at
    // an admin (or a disabled account) is indistinguishable from a bad id.
    if (!to || to.role !== expected || to.status !== 'ACTIVE') {
      throw new NotFoundException('Not found');
    }

    const existing = await this.prisma.introRequest.findFirst({
      where: {
        fromUserId: from.sub,
        toUserId,
        status: IntroRequestStatus.PENDING,
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending request with them');
    }

    return this.prisma.introRequest.create({
      data: { fromUserId: from.sub, toUserId, note: note?.trim() || null },
      select: { id: true, toUserId: true, status: true, note: true, createdAt: true },
    });
  }

  /** Both directions, so one call powers the whole inbox. */
  async list(user: AccessTokenPayload) {
    const shape = {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    };
    const party = {
      select: {
        id: true,
        role: true,
        founderProfile: { select: { companyName: true, sector: true, stage: true } },
        investorProfile: { select: { name: true, investorTypes: true } },
      },
    };

    const [sent, received] = await Promise.all([
      this.prisma.introRequest.findMany({
        where: { fromUserId: user.sub },
        orderBy: { createdAt: 'desc' },
        select: { ...shape, toUser: party },
      }),
      this.prisma.introRequest.findMany({
        where: { toUserId: user.sub },
        orderBy: { createdAt: 'desc' },
        select: { ...shape, fromUser: party },
      }),
    ]);

    return {
      sent: sent.map((r) => ({ ...r, counterparty: this.describe(r.toUser) })),
      // Contact details are only attached once the request has been accepted.
      received: await Promise.all(
        received.map(async (r) => ({
          ...r,
          counterparty: this.describe(r.fromUser),
          contact:
            r.status === IntroRequestStatus.ACCEPTED ? await this.contactFor(r.fromUser.id) : null,
        })),
      ),
    };
  }

  private describe(u: {
    id: string;
    role: Role;
    founderProfile: { companyName: string; sector: string; stage: string } | null;
    investorProfile: { name: string; investorTypes: string[] } | null;
  }) {
    return {
      userId: u.id,
      role: u.role,
      name: u.founderProfile?.companyName ?? u.investorProfile?.name ?? 'Unknown',
      detail: u.founderProfile
        ? `${u.founderProfile.sector} · ${u.founderProfile.stage}`
        : (u.investorProfile?.investorTypes ?? []).join(', '),
    };
  }

  private contactFor(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mobile: true },
    });
  }

  /**
   * Only the recipient decides. The sender cannot accept on their own behalf,
   * and a decision is final so a declined request cannot be flipped later.
   */
  async respond(user: AccessTokenPayload, id: string, status: IntroRequestStatus) {
    if (status === IntroRequestStatus.PENDING) {
      throw new BadRequestException('Respond with ACCEPTED or DECLINED');
    }

    const request = await this.prisma.introRequest.findUnique({
      where: { id },
      select: { id: true, toUserId: true, status: true, fromUserId: true },
    });
    if (!request || request.toUserId !== user.sub) throw new NotFoundException('Not found');
    if (request.status !== IntroRequestStatus.PENDING) {
      throw new BadRequestException(`This request was already ${request.status.toLowerCase()}`);
    }

    const updated = await this.prisma.introRequest.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    return {
      ...updated,
      contact:
        status === IntroRequestStatus.ACCEPTED ? await this.contactFor(request.fromUserId) : null,
    };
  }
}
