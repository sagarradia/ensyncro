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
import { Role } from '@prisma/client';
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

  // ── Deep profile: all structured sections for the editor ─────

  @Get('sections')
  sections(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.ownSections(user);
  }

  // Promoters
  @Post('promoters')
  addPromoter(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreatePromoterDto) {
    return this.founders.addPromoter(user, dto);
  }
  @Delete('promoters/:id')
  removePromoter(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removePromoter(user, id);
  }

  // Group companies
  @Post('group-companies')
  addGroupCompany(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateGroupCompanyDto) {
    return this.founders.addGroupCompany(user, dto);
  }
  @Delete('group-companies/:id')
  removeGroupCompany(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeGroupCompany(user, id);
  }

  // Products & services
  @Post('products-services')
  addProductService(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateProductServiceDto) {
    return this.founders.addProductService(user, dto);
  }
  @Delete('products-services/:id')
  removeProductService(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeProductService(user, id);
  }

  // Competitors
  @Post('competitors')
  addCompetitor(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateCompetitorDto) {
    return this.founders.addCompetitor(user, dto);
  }
  @Delete('competitors/:id')
  removeCompetitor(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeCompetitor(user, id);
  }

  // SWOT
  @Post('swot')
  addSwot(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateSwotItemDto) {
    return this.founders.addSwotItem(user, dto);
  }
  @Delete('swot/:id')
  removeSwot(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeSwotItem(user, id);
  }

  // Risks (gated)
  @Get('risks')
  risks(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.risks(user.sub, user);
  }
  @Post('risks')
  addRisk(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateRiskItemDto) {
    return this.founders.addRiskItem(user, dto);
  }
  @Delete('risks/:id')
  removeRisk(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeRiskItem(user, id);
  }

  // Future plans (gated)
  @Get('future-plans')
  futurePlans(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.futurePlans(user.sub, user);
  }
  @Post('future-plans')
  addFuturePlan(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateFuturePlanDto) {
    return this.founders.addFuturePlan(user, dto);
  }
  @Delete('future-plans/:id')
  removeFuturePlan(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeFuturePlan(user, id);
  }

  // Benchmark peers (part of the gated Financials section)
  @Post('benchmark-peers')
  addBenchmarkPeer(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateBenchmarkPeerDto) {
    return this.founders.addBenchmarkPeer(user, dto);
  }
  @Delete('benchmark-peers/:id')
  removeBenchmarkPeer(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeBenchmarkPeer(user, id);
  }

  // ── Broader Investee scope (PRD v2 §7/§8) ────────────────────

  /** Classification / funding requirement / operations (public meta). */
  @Put('meta')
  updateMeta(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateInvesteeMetaDto) {
    return this.founders.updateMeta(user, dto);
  }

  /** Sector master list for the classification dropdown. */
  @Get('sectors')
  sectors() {
    return this.founders.sectors();
  }

  // Shareholding (gated)
  @Get('shareholding')
  shareholding(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.shareholding(user.sub, user);
  }
  @Post('shareholders')
  addShareholder(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateShareholderDto) {
    return this.founders.addShareholder(user, dto);
  }
  @Delete('shareholders/:id')
  removeShareholder(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeShareholder(user, id);
  }

  // Customers (public)
  @Post('customers')
  addCustomer(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateNamedItemDto) {
    return this.founders.addCustomer(user, dto);
  }
  @Delete('customers/:id')
  removeCustomer(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeCustomer(user, id);
  }

  // Suppliers (public)
  @Post('suppliers')
  addSupplier(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateNamedItemDto) {
    return this.founders.addSupplier(user, dto);
  }
  @Delete('suppliers/:id')
  removeSupplier(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeSupplier(user, id);
  }

  // Projected financials (gated)
  @Get('projected-financials')
  projectedFinancials(@CurrentUser() user: AccessTokenPayload) {
    return this.founders.projectedFinancialsFor(user.sub, user);
  }
  @Post('projected-financials')
  addProjectedFinancial(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateProjectedFinancialDto) {
    return this.founders.addProjectedFinancial(user, dto);
  }
  @Delete('projected-financials/:id')
  removeProjectedFinancial(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.founders.removeProjectedFinancial(user, id);
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

  /** Gated: structured risks, authorised per viewer and audited. */
  @Get(':userId/risks')
  risks(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() viewer: AccessTokenPayload) {
    return this.founders.risks(userId, viewer);
  }

  /** Gated: roadmap / future plans, authorised per viewer and audited. */
  @Get(':userId/future-plans')
  futurePlans(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
  ) {
    return this.founders.futurePlans(userId, viewer);
  }

  /** Gated: cap-table / shareholding, authorised per viewer and audited. */
  @Get(':userId/shareholding')
  shareholding(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
  ) {
    return this.founders.shareholding(userId, viewer);
  }

  /** Gated: projected financials, authorised per viewer and audited. */
  @Get(':userId/projected-financials')
  projectedFinancials(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
  ) {
    return this.founders.projectedFinancialsFor(userId, viewer);
  }
}
