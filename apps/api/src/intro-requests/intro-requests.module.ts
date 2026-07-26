import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DealsModule } from '../deals/deals.module';
import { IntroRequestsController } from './intro-requests.controller';
import { IntroRequestsService } from './intro-requests.service';

@Module({
  imports: [AuthModule, DealsModule],
  controllers: [IntroRequestsController],
  providers: [IntroRequestsService],
})
export class IntroRequestsModule {}
