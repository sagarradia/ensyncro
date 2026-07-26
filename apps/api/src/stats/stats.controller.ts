import { Controller, Get } from '@nestjs/common';
import { DealStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public platform counters for the marketing homepage (PRD §6). These are live
 * counts computed on request rather than the platform_stats snapshot table,
 * which has no writer wired yet — real numbers, never hardcoded. Only
 * aggregate, non-identifying totals are exposed, so this is safe to serve
 * unauthenticated.
 */
@Controller('stats')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const [founders, investors, deals, dealsClosed] = await Promise.all([
      this.prisma.founderProfile.count(),
      this.prisma.investorProfile.count(),
      this.prisma.deal.count(),
      this.prisma.deal.count({ where: { status: DealStatus.WON } }),
    ]);
    return { founders, investors, deals, dealsClosed };
  }
}
