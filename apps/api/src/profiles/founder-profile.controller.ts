import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { UpsertFounderProfileDto } from './dto/upsert-founder-profile.dto';

/**
 * Founder company profile (task #7). A founder can only ever read or write
 * their OWN profile — the userId comes from the verified token, never from the
 * request body, so one founder cannot touch another's record.
 */
@Controller('founder/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FOUNDER)
export class FounderProfileController {
  constructor(private readonly prisma: PrismaService) {}

  /** Own profile, or null if onboarding hasn't started. */
  @Get()
  get(@CurrentUser() user: AccessTokenPayload) {
    return this.prisma.founderProfile.findUnique({ where: { userId: user.sub } });
  }

  /** Create or update own profile — the wizard saves each step here. */
  @Put()
  upsert(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpsertFounderProfileDto) {
    return this.prisma.founderProfile.upsert({
      where: { userId: user.sub },
      create: { ...dto, userId: user.sub },
      update: dto,
    });
  }
}
