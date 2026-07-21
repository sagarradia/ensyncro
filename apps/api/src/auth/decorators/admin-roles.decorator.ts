import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

export const ADMIN_ROLES_KEY = 'adminRoles';

/**
 * Restricts a route to specific admin sub-roles (PRD §3:
 * Super Admin / Finance / Legal / Ops). Enforced by AdminRolesGuard.
 * SUPER always satisfies the requirement.
 *
 * Usage: `@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)`
 *        `@Roles(Role.ADMIN) @AdminRoles(AdminRole.FINANCE)`
 */
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);
