import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiscoverController } from './discover.controller';

@Module({
  imports: [AuthModule],
  controllers: [DiscoverController],
})
export class DiscoverModule {}
