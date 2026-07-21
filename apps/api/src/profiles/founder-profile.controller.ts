import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProfileSection, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FounderProfileService } from './founder-profile.service';
import {
  CreateFundingRoundDto,
  CreateMilestoneDto,
  SetSectionVisibilityDto,
  UpdateFinancialsDto,
  UpdateFounderMediaDto,
  UpdateFounderProductDto,
} from './dto/founder-media.dto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly founders: FounderProfileService,
  ) {}

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

  // ── Media ────────────────────────────────────────────────────

  @Get('media')
  media(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.mediaFor(user.sub);
  }

  @Put('media')
  updateMedia(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateFounderMediaDto) {
    return this.founders.updateMedia(user, dto);
  }

  // ── Product page ─────────────────────────────────────────────

  @Put('product')
  updateProduct(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateFounderProductDto) {
    return this.founders.updateProduct(user, dto);
  }

  // ── Financials + milestones (gated when others look) ─────────

  @Get('financials')
  financials(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.financials(user.sub, user);
  }

  @Put('financials')
  updateFinancials(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateFinancialsDto) {
    return this.founders.updateFinancials(user, dto);
  }

  @Put('section-visibility')
  setSectionVisibility(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SetSectionVisibilityDto,
  ) {
    return this.founders.setSectionVisibility(user, dto.section, dto.visibility);
  }

  @Post('milestones')
  addMilestone(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateMilestoneDto) {
    return this.founders.addMilestone(user, dto);
  }

  @Delete('milestones/:id')
  removeMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.founders.removeMilestone(user, id);
  }

  // ── Funding history ──────────────────────────────────────────

  @Get('funding-rounds')
  fundingRounds(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.fundingHistory(user.sub, user);
  }

  @Post('funding-rounds')
  addFundingRound(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateFundingRoundDto) {
    return this.founders.addFundingRound(user, dto);
  }

  @Delete('funding-rounds/:id')
  removeFundingRound(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.founders.removeFundingRound(user, id);
  }

  /** Who has opened the founder's gated sections. */
  @Get('section-access-log')
  sectionAccessLog(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.sectionAccessLog(user);
  }
}

/**
 * What other signed-in users see. Separate controller because these are not
 * founder-only: investors and admins reach them from discovery.
 */
@Controller('founders')
@UseGuards(JwtAuthGuard)
export class FounderPublicController {
  constructor(private readonly founders: FounderProfileService) {}

  /** Ungated product page. */
  @Get(':userId/product')
  product(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
  ) {
    return this.founders.productPage(userId, viewer);
  }

  /** Gated: authorised per viewer, and every view is recorded. */
  @Get(':userId/financials')
  financials(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
  ) {
    return this.founders.financials(userId, viewer);
  }

  @Get(':userId/funding-history')
  fundingHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
  ) {
    return this.founders.fundingHistory(userId, viewer);
  }
}
