import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminInviteAcceptController } from './admin-invite-accept.controller';
import { AdminInvitesService } from './admin-invites.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminInviteAcceptController],
  providers: [AdminInvitesService],
})
export class AdminModule {}
