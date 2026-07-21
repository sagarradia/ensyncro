import { Body, Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common';
import { AdminRole, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminInvitesService } from './admin-invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';

/**
 * Admin area. Every route is gated server-side: JwtAuthGuard verifies the
 * token, RolesGuard requires ADMIN, and AdminRolesGuard narrows to sub-roles
 * where needed (PRD §3 / §4).
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invites: AdminInvitesService,
  ) {}

  /** The signed-in admin's own profile, including sub-role. */
  @Get('me')
  async me(@CurrentUser() user: AccessTokenPayload) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId: user.sub },
      select: { adminRole: true, createdAt: true },
    });
    if (!profile) throw new ForbiddenException('No admin profile for this account');
    return { userId: user.sub, email: user.email, adminRole: profile.adminRole };
  }

  /**
   * Invite a new admin (Super Admin only — PRD §3: invite-only, no public
   * admin signup). Returns the raw token once; only its hash is stored.
   */
  @Post('invites')
  @AdminRoles(AdminRole.SUPER)
  createInvite(@Body() dto: CreateInviteDto, @CurrentUser() user: AccessTokenPayload) {
    return this.invites.create(dto, user.sub);
  }

  /** Pending (unconsumed, unexpired) invites — Super Admin only. */
  @Get('invites')
  @AdminRoles(AdminRole.SUPER)
  listInvites() {
    return this.invites.list();
  }

  /** Platform-wide counts — Ops/Super only. Demonstrates sub-role narrowing. */
  @Get('stats')
  @AdminRoles(AdminRole.OPS)
  async stats() {
    const [founders, investors, admins] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.FOUNDER } }),
      this.prisma.user.count({ where: { role: Role.INVESTOR } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
    ]);
    return { founders, investors, admins };
  }
}
