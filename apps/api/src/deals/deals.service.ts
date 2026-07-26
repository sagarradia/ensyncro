import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DealEventKind, DealStage, DealStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload } from '../auth/tokens/token.service';

/** Readable stage labels for timeline entries and the API surface. */
const STAGE_LABEL: Record<DealStage, string> = {
  INTEREST: 'Interest',
  MEETING_SCHEDULED: 'Meeting Scheduled',
  NDA: 'NDA',
  DATA_ROOM_ACCESS: 'Data Room Access',
  DUE_DILIGENCE: 'Due Diligence',
  OFFER: 'Offer',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

const statusForStage = (stage: DealStage): DealStatus =>
  stage === DealStage.CLOSED_WON
    ? DealStatus.WON
    : stage === DealStage.CLOSED_LOST
      ? DealStatus.LOST
      : DealStatus.OPEN;

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create the deal for an accepted intro (idempotent). Called from the intro
   * accept flow — a deal is never created from scratch. The two parties are
   * resolved by role, since an intro is always founder <-> investor.
   */
  async createFromAcceptedIntro(introRequestId: string) {
    const existing = await this.prisma.deal.findUnique({ where: { introRequestId } });
    if (existing) return existing;

    const intro = await this.prisma.introRequest.findUnique({
      where: { id: introRequestId },
      select: {
        fromUser: { select: { id: true, role: true } },
        toUser: { select: { id: true, role: true } },
      },
    });
    if (!intro) return null;

    const both = [intro.fromUser, intro.toUser];
    const founder = both.find((u) => u.role === Role.FOUNDER);
    const investor = both.find((u) => u.role === Role.INVESTOR);
    if (!founder || !investor) return null; // not a founder<->investor intro

    return this.prisma.deal.create({
      data: {
        introRequestId,
        founderId: founder.id,
        investorId: investor.id,
        stage: DealStage.INTEREST,
        status: DealStatus.OPEN,
        events: {
          create: { kind: DealEventKind.CREATED, body: 'Deal created from an accepted intro.' },
        },
      },
    });
  }

  /** A user may act on a deal if they are one of its parties, or an admin. */
  private async requireAccess(dealId: string, user: AccessTokenPayload) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, founderId: true, investorId: true, stage: true, status: true },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    const isParty = deal.founderId === user.sub || deal.investorId === user.sub;
    if (!isParty && user.role !== Role.ADMIN) throw new ForbiddenException('Not your deal');
    return deal;
  }

  private readonly partySelect = {
    id: true,
    email: true,
    founderProfile: { select: { companyName: true } },
    investorProfile: { select: { name: true } },
  } as const;

  private shape(deal: {
    id: string;
    stage: DealStage;
    status: DealStatus;
    createdAt: Date;
    updatedAt: Date;
    founder: { id: string; email: string; founderProfile: { companyName: string } | null };
    investor: { id: string; email: string; investorProfile: { name: string } | null };
  }) {
    return {
      id: deal.id,
      stage: deal.stage,
      stageLabel: STAGE_LABEL[deal.stage],
      status: deal.status,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      founder: {
        userId: deal.founder.id,
        email: deal.founder.email,
        name: deal.founder.founderProfile?.companyName ?? deal.founder.email,
      },
      investor: {
        userId: deal.investor.id,
        email: deal.investor.email,
        name: deal.investor.investorProfile?.name ?? deal.investor.email,
      },
    };
  }

  /** The caller's deals — parties see their own, admins see all. */
  async list(user: AccessTokenPayload) {
    const where =
      user.role === Role.ADMIN
        ? {}
        : { OR: [{ founderId: user.sub }, { investorId: user.sub }] };
    const deals = await this.prisma.deal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        stage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        founder: { select: this.partySelect },
        investor: { select: this.partySelect },
      },
    });
    return deals.map((d) => this.shape(d));
  }

  /** One deal with its timeline and task checklist. */
  async get(dealId: string, user: AccessTokenPayload) {
    await this.requireAccess(dealId, user);
    const deal = await this.prisma.deal.findUniqueOrThrow({
      where: { id: dealId },
      select: {
        id: true,
        stage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        founder: { select: this.partySelect },
        investor: { select: this.partySelect },
        events: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            kind: true,
            body: true,
            createdAt: true,
            actor: { select: { id: true, email: true, role: true } },
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, done: true, completedAt: true },
        },
      },
    });
    return { ...this.shape(deal), timeline: deal.events, tasks: deal.tasks };
  }

  private logEvent(dealId: string, actorId: string, kind: DealEventKind, body: string) {
    return this.prisma.dealEvent.create({ data: { dealId, actorId, kind, body } });
  }

  async changeStage(dealId: string, user: AccessTokenPayload, stage: DealStage) {
    const deal = await this.requireAccess(dealId, user);
    if (stage === deal.stage) return this.get(dealId, user);

    await this.prisma.$transaction([
      this.prisma.deal.update({
        where: { id: dealId },
        data: { stage, status: statusForStage(stage) },
      }),
      this.logEvent(
        dealId,
        user.sub,
        DealEventKind.STAGE_CHANGED,
        `${STAGE_LABEL[deal.stage]} → ${STAGE_LABEL[stage]}`,
      ),
    ]);
    return this.get(dealId, user);
  }

  async addComment(dealId: string, user: AccessTokenPayload, body: string) {
    await this.requireAccess(dealId, user);
    await this.logEvent(dealId, user.sub, DealEventKind.COMMENT, body);
    return this.get(dealId, user);
  }

  async addTask(dealId: string, user: AccessTokenPayload, title: string) {
    await this.requireAccess(dealId, user);
    await this.prisma.$transaction([
      this.prisma.dealTask.create({ data: { dealId, title, createdById: user.sub } }),
      this.logEvent(dealId, user.sub, DealEventKind.TASK_ADDED, `Task added: ${title}`),
    ]);
    return this.get(dealId, user);
  }

  async toggleTask(dealId: string, user: AccessTokenPayload, taskId: string, done: boolean) {
    await this.requireAccess(dealId, user);
    const task = await this.prisma.dealTask.findFirst({ where: { id: taskId, dealId } });
    if (!task) throw new NotFoundException('Task not found');

    const ops: Promise<unknown>[] = [
      this.prisma.dealTask.update({
        where: { id: taskId },
        data: { done, completedAt: done ? new Date() : null },
      }),
    ];
    // Only completion is worth a timeline entry; reopening is silent.
    if (done && !task.done) {
      ops.push(this.logEvent(dealId, user.sub, DealEventKind.TASK_COMPLETED, `Task completed: ${task.title}`));
    }
    await Promise.all(ops);
    return this.get(dealId, user);
  }
}
