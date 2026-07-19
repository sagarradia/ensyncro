import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // Loads .env in local dev; in hosted environments the platform
      // (Vercel) provides the variables directly.
      envFilePath: ['.env'],
    }),
    PrismaModule,
    HealthModule,
    // Feature modules (auth, founders, investors, admin, data-room, cms, ...)
    // will be registered here as they are built. See PRD §5 / §7.
  ],
})
export class AppModule {}
