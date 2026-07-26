import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [AuthModule],
  controllers: [DealsController],
  providers: [DealsService],
  // Exported so the intro-accept flow can create a deal.
  exports: [DealsService],
})
export class DealsModule {}
