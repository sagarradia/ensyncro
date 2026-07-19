import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

type TokenUser = { id: string; email: string; role: Role };

/**
 * Issues short-lived JWT access tokens and long-lived, revocable refresh
 * tokens. Refresh tokens are opaque random strings stored only as SHA-256
 * hashes, so a database leak does not expose usable tokens, and they can be
 * revoked/rotated server-side (session-based auth per PRD §4).
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private accessSecret(): string {
    const secret = this.config.get<string>('jwt.accessSecret');
    if (secret) return secret;
    // Keeps the auth-less-secret skeleton runnable in local/demo; must be set
    // for staging/production (env validation warns when missing there).
    this.logger.warn(
      'JWT_ACCESS_SECRET not set — using an insecure development fallback.',
    );
    return 'dev-insecure-access-secret-do-not-use-in-prod';
  }

  async issuePair(user: TokenUser): Promise<TokenPair> {
    const expiresIn = this.config.get<number>('jwt.accessTtl') ?? 900;
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret(),
      expiresIn,
    });
    const refreshToken = await this.createRefreshToken(user.id);
    return { accessToken, refreshToken, expiresIn };
  }

  verifyAccess(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.accessSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async rotateRefreshToken(raw: string): Promise<TokenPair & { userId: string }> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(raw) },
      include: { user: true },
    });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    // Rotation: revoke the presented token before issuing a new pair.
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    const pair = await this.issuePair(existing.user);
    return { userId: existing.userId, ...pair };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(48).toString('hex');
    const ttl = this.config.get<number>('jwt.refreshTtl') ?? 1209600;
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(raw),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    return raw;
  }
}
