import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

/**
 * Invite-only admin creation (task #9 / PRD §3).
 *
 * The invite token is a random string returned once at creation and stored
 * only as a SHA-256 hash, so a database leak cannot yield usable invites.
 */
@Injectable()
export class AdminInvitesService {
  private readonly logger = new Logger(AdminInvitesService.name);
  private readonly ttlHours = 72;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(dto: CreateInviteDto, createdById: string) {
    const email = dto.email.toLowerCase();

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with that email already exists');
    }

    const token = randomBytes(32).toString('hex');
    const invite = await this.prisma.adminInvite.create({
      data: {
        email,
        adminRole: dto.adminRole,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + this.ttlHours * 3600 * 1000),
        createdById,
      },
      select: { id: true, email: true, adminRole: true, expiresAt: true },
    });

    // Real delivery (email) is phase 2 alongside the OTP provider; for now the
    // token is returned to the caller so an admin can pass it on out-of-band.
    this.logger.log(`[ADMIN INVITE] ${invite.email} (${invite.adminRole})`);
    return { ...invite, token };
  }

  list() {
    return this.prisma.adminInvite.findMany({
      where: { consumedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, adminRole: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Resolves a raw invite token to a usable invite, or throws. */
  async resolveValid(token: string) {
    const invite = await this.prisma.adminInvite.findUnique({
      where: { tokenHash: this.hash(token) },
    });
    if (!invite || invite.consumedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }
    return invite;
  }

  markConsumed(id: string) {
    return this.prisma.adminInvite.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  /** Sub-role for the very first admin, used by the bootstrap path. */
  static readonly BOOTSTRAP_ROLE: AdminRole = AdminRole.SUPER;
}
