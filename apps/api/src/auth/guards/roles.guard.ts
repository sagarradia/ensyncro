import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthedRequest } from './jwt-auth.guard';

/**
 * Enforces the top-level role (FOUNDER / INVESTOR / ADMIN) from the verified
 * access token. Must run after JwtAuthGuard, which populates req.user.
 * Routes with no @Roles metadata are left alone.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new UnauthorizedException('Not authenticated');

    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Requires role: ${required.join(' or ')}`);
    }
    return true;
  }
}
