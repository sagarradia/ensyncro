import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route (or controller) to the given top-level roles.
 * Enforced server-side by RolesGuard — never rely on the UI hiding things
 * (PRD §4: RBAC is enforced on every request).
 *
 * Usage: `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.FOUNDER)`
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
