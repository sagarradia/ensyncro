import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AuthedRequest } from './jwt-auth.guard';

/**
 * Authorizes admin sub-roles.
 *
 * The sub-role is read from the AdminProfile in the database rather than from
 * a JWT claim, so revoking or changing an admin's sub-role takes effect on the
 * next request instead of whenever their access token happens to expire.
 * Admin routes are low-traffic, so the extra read is a worthwhile trade.
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AdminRole[] | undefined>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new UnauthorizedException('Not authenticated');
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin access required');

    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId: user.sub },
      select: { adminRole: true },
    });
    if (!profile) throw new ForbiddenException('No admin profile for this account');

    // Super Admin implicitly satisfies every sub-role requirement.
    if (profile.adminRole === AdminRole.SUPER) return true;

    if (!required.includes(profile.adminRole)) {
      throw new ForbiddenException(`Requires admin role: ${required.join(' or ')}`);
    }
    return true;
  }
}
