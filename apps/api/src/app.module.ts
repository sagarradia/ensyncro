import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';

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
  ],
  controllers: [AppController],
})
export class AppModule {}
