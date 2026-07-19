import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import { OtpChannel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * One-time-passcode issuing/verification. In demo/staging (`OTP_MODE=mock`)
 * codes are logged and returned to the caller instead of being delivered by a
 * real provider. Real SMS/email delivery is phase 2 (PRD §9).
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlSeconds = 600; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  get mode(): string {
    return this.config.get<string>('otpMode') ?? 'mock';
  }

  /**
   * Generates a 6-digit code, stores its hash, and "sends" it.
   * Returns the plaintext code only in mock mode (for demo/staging + tests).
   */
  async issue(
    userId: string,
    channel: OtpChannel,
    destination: string,
  ): Promise<string | null> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.otpCode.create({
      data: {
        userId,
        channel,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + this.ttlSeconds * 1000),
      },
    });

    if (this.mode === 'mock') {
      this.logger.log(`[MOCK OTP] ${channel} code for ${destination}: ${code}`);
      return code;
    }

    this.logger.warn(
      `OTP_MODE=live but no provider is integrated (phase 2); code for ${destination} was not delivered.`,
    );
    return null;
  }

  async verify(
    userId: string,
    channel: OtpChannel,
    code: string,
  ): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        channel,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.codeHash !== this.hash(code)) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
