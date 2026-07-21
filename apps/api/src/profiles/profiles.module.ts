import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FounderProfileController } from './founder-profile.controller';

@Module({
  imports: [AuthModule],
  controllers: [FounderProfileController],
})
export class ProfilesModule {}
