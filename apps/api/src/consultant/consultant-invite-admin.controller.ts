import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminRole, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { ConsultantInvitesService } from './consultant-invites.service';
import { CreateConsultantInviteDto } from './dto/create-consultant-invite.dto';

/**
 * Admins invite consultants — same gating as admin invites (Super Admin only,
 * invite-only, no public consultant signup). Kept under /admin so it sits with
 * the other admin-managed invite flows.
 */
@Controller('admin/consultant-invites')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
@AdminRoles(AdminRole.SUPER)
export class ConsultantInviteAdminController {
  constructor(private readonly invites: ConsultantInvitesService) {}

  @Post()
  create(@Body() dto: CreateConsultantInviteDto, @CurrentUser() user: AccessTokenPayload) {
    return this.invites.create(dto, user.sub);
  }

  @Get()
  list() {
    return this.invites.list();
  }
}
