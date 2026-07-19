import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '../tokens/token.service';
import { AuthedRequest } from '../guards/jwt-auth.guard';

/** Injects the authenticated user's access-token payload (requires JwtAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload | undefined => {
    return ctx.switchToHttp().getRequest<AuthedRequest>().user;
  },
);
