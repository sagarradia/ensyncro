import { Body, Controller, Get, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';

/**
 * Consultant area (PRD v2 §4). MVP: the consultant's own profile only —
 * assignment / deliverables / timesheets / billing are the v1.2 Professional
 * Engagement module and are deliberately not here yet.
 */
@Controller('consultant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CONSULTANT)
export class ConsultantController {
  constructor(private readonly prisma: PrismaService) {}

  /** The signed-in consultant's own profile. */
  @Get('me')
  async me(@CurrentUser() user: AccessTokenPayload) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { userId: user.sub },
      select: {
        consultantType: true,
        name: true,
        firm: true,
        registrationNumber: true,
        completed: true,
      },
    });
    if (!profile) throw new NotFoundException('No consultant profile for this account');
    return { userId: user.sub, email: user.email, ...profile };
  }

  /** Update the editable profile fields (type is fixed at invite time). */
  @Put('profile')
  async update(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateConsultantProfileDto) {
    await this.prisma.consultantProfile.update({
      where: { userId: user.sub },
      data: {
        ...(dto.name !== undefined ? { name: dto.name || null } : {}),
        ...(dto.firm !== undefined ? { firm: dto.firm || null } : {}),
        ...(dto.registrationNumber !== undefined
          ? { registrationNumber: dto.registrationNumber || null }
          : {}),
        completed: true,
      },
    });
    return this.me(user);
  }
}
