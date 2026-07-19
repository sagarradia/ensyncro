import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload, TokenService } from '../tokens/token.service';

export interface AuthedRequest extends Request {
  user?: AccessTokenPayload;
}

/**
 * Validates the Bearer access token and attaches the payload to req.user.
 * Role-based authorization (Admin / Founder / Investor) is layered on top
 * in task #6.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    req.user = this.tokens.verifyAccess(header.slice('Bearer '.length));
    return true;
  }
}
