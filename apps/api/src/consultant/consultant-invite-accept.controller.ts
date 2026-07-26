import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password/password.service';
import { TokenService } from '../auth/tokens/token.service';
import { ConsultantInvitesService } from './consultant-invites.service';
import { AcceptConsultantInviteDto } from './dto/accept-consultant-invite.dto';

/**
 * Public endpoint an invited consultant uses to set their password and activate
 * the account. Unguarded on purpose — the invite token IS the credential —
 * mirroring the admin accept flow.
 */
@Controller('consultant/invites')
export class ConsultantInviteAcceptController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invites: ConsultantInvitesService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(@Body() dto: AcceptConsultantInviteDto) {
    const invite = await this.invites.resolveValid(dto.token);

    if (await this.prisma.user.findUnique({ where: { email: invite.email } })) {
      throw new ConflictException('A user with that email already exists');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invite.email,
          mobile: dto.mobile,
          passwordHash,
          role: Role.CONSULTANT,
          status: UserStatus.ACTIVE,
          // The invite itself proves control of the mailbox.
          emailVerified: true,
          mobileVerified: Boolean(dto.mobile),
        },
      });
      await tx.consultantProfile.create({
        data: { userId: created.id, consultantType: invite.consultantType },
      });
      return created;
    });

    await this.invites.markConsumed(invite.id);

    const pair = await this.tokens.issuePair(user);
    return {
      ...pair,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        consultantType: invite.consultantType,
      },
    };
  }
}
