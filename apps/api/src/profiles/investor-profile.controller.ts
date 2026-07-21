import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { UpsertInvestorProfileDto } from './dto/upsert-investor-profile.dto';

/**
 * Investor profile (task #8). As with founders, the owning user comes from the
 * verified token, never the request body.
 */
@Controller('investor/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INVESTOR)
export class InvestorProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  get(@CurrentUser() user: AccessTokenPayload) {
    return this.prisma.investorProfile.findUnique({ where: { userId: user.sub } });
  }

  @Put()
  upsert(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpsertInvestorProfileDto) {
    return this.prisma.investorProfile.upsert({
      where: { userId: user.sub },
      create: { ...dto, userId: user.sub },
      update: dto,
    });
  }
}
