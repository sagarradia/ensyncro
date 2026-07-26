import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultantInviteDto } from './dto/create-consultant-invite.dto';

/**
 * Invite-only consultant creation (PRD v2 §4), mirroring AdminInvitesService.
 *
 * The invite token is a random string returned once at creation and stored
 * only as a SHA-256 hash, so a database leak cannot yield usable invites.
 */
@Injectable()
export class ConsultantInvitesService {
  private readonly logger = new Logger(ConsultantInvitesService.name);
  private readonly ttlHours = 72;

  constructor(private readonly prisma: PrismaService) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(dto: CreateConsultantInviteDto, createdById: string) {
    const email = dto.email.toLowerCase();

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with that email already exists');
    }

    const token = randomBytes(32).toString('hex');
    const invite = await this.prisma.consultantInvite.create({
      data: {
        email,
        consultantType: dto.consultantType,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + this.ttlHours * 3600 * 1000),
        createdById,
      },
      select: { id: true, email: true, consultantType: true, expiresAt: true },
    });

    // Real email delivery is phase 2; for now the token is returned so an admin
    // can pass it on out-of-band (same as admin invites).
    this.logger.log(`[CONSULTANT INVITE] ${invite.email} (${invite.consultantType})`);
    return { ...invite, token };
  }

  list() {
    return this.prisma.consultantInvite.findMany({
      where: { consumedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, consultantType: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Resolves a raw invite token to a usable invite, or throws. */
  async resolveValid(token: string) {
    const invite = await this.prisma.consultantInvite.findUnique({
      where: { tokenHash: this.hash(token) },
    });
    if (!invite || invite.consumedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }
    return invite;
  }

  markConsumed(id: string) {
    return this.prisma.consultantInvite.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
