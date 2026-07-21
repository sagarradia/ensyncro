import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FounderProfileController } from './founder-profile.controller';
import { InvestorProfileController } from './investor-profile.controller';

@Module({
  imports: [AuthModule],
  controllers: [FounderProfileController, InvestorProfileController],
})
export class ProfilesModule {}
