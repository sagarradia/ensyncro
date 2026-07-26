import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';

/** Public platform counters for the marketing homepage. */
@Module({
  controllers: [StatsController],
})
export class StatsModule {}
