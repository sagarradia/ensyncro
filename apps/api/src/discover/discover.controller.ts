import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DiscoverFoundersQuery } from './dto/discover-founders.query';
import { DiscoverInvestorsQuery } from './dto/discover-investors.query';

const DEFAULT_TAKE = 20;

/**
 * Discovery (task #11). The cross-side rule is enforced by role:
 * investors browse founders, founders browse investors. Admins may see both.
 * Only completed profiles are discoverable.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscoverController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('founders/discover')
  @Roles(Role.INVESTOR, Role.ADMIN)
  async discoverFounders(@Query() q: DiscoverFoundersQuery) {
    const where: Prisma.FounderProfileWhereInput = { completed: true };

    if (q.sector) where.sector = { contains: q.sector, mode: 'insensitive' };
    if (q.stage) where.stage = q.stage;
    if (q.fundingMin !== undefined || q.fundingMax !== undefined) {
      where.fundingSought = {
        ...(q.fundingMin !== undefined ? { gte: q.fundingMin } : {}),
        ...(q.fundingMax !== undefined ? { lte: q.fundingMax } : {}),
      };
    }

    const take = q.take ?? DEFAULT_TAKE;
    const [total, items] = await Promise.all([
      this.prisma.founderProfile.count({ where }),
      this.prisma.founderProfile.findMany({
        where,
        take,
        skip: q.skip ?? 0,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          companyName: true,
          sector: true,
          stage: true,
          fundingSought: true,
          location: true,
          teamSize: true,
          description: true,
          website: true,
        },
      }),
    ]);

    return { total, take, skip: q.skip ?? 0, items };
  }

  @Get('investors/discover')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async discoverInvestors(@Query() q: DiscoverInvestorsQuery) {
    const where: Prisma.InvestorProfileWhereInput = { completed: true };

    if (q.investorType) where.investorTypes = { has: q.investorType };
    if (q.sector) where.sectors = { has: q.sector };
    // Overlap semantics: an unset bound on the investor side never excludes them.
    if (q.ticketMin !== undefined) {
      where.OR = [{ ticketMax: null }, { ticketMax: { gte: q.ticketMin } }];
    }
    if (q.ticketMax !== undefined) {
      where.AND = [{ OR: [{ ticketMin: null }, { ticketMin: { lte: q.ticketMax } }] }];
    }

    const take = q.take ?? DEFAULT_TAKE;
    const [total, items] = await Promise.all([
      this.prisma.investorProfile.count({ where }),
      this.prisma.investorProfile.findMany({
        where,
        take,
        skip: q.skip ?? 0,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          name: true,
          investorTypes: true,
          sectors: true,
          ticketMin: true,
          ticketMax: true,
          location: true,
          description: true,
          website: true,
        },
      }),
    ]);

    return { total, take, skip: q.skip ?? 0, items };
  }
}
