import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataRoomModule } from '../data-room/data-room.module';
import {
  FounderProfileController,
  FounderPublicController,
} from './founder-profile.controller';
import { InvestorProfileController } from './investor-profile.controller';
import { FounderProfileService } from './founder-profile.service';

@Module({
  // DataRoomModule exports FileStorage, which resolves logos and uploaded
  // pitch videos to playable URLs.
  imports: [AuthModule, DataRoomModule],
  controllers: [FounderProfileController, FounderPublicController, InvestorProfileController],
  providers: [FounderProfileService],
})
export class ProfilesModule {}
