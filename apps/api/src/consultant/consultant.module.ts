import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConsultantController } from './consultant.controller';
import { ConsultantInviteAcceptController } from './consultant-invite-accept.controller';
import { ConsultantInviteAdminController } from './consultant-invite-admin.controller';
import { ConsultantInvitesService } from './consultant-invites.service';

@Module({
  imports: [AuthModule],
  controllers: [
    ConsultantController,
    ConsultantInviteAcceptController,
    ConsultantInviteAdminController,
  ],
  providers: [ConsultantInvitesService],
})
export class ConsultantModule {}
