import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { findRepoRoot } from './config/repo-root';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

// Local env files live at the monorepo root and are selected by APP_ENV.
// In hosted environments (Vercel) variables are injected directly, so these
// files simply won't exist and are skipped.
const appEnv = process.env.APP_ENV ?? 'demo';
const root = findRepoRoot();
const envFilePath = [
  resolve(root, `.env.${appEnv}.local`),
  resolve(root, `.env.${appEnv}`),
  resolve(root, '.env.local'),
  resolve(root, '.env'),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    // Further feature modules (founders, investors, data-room, cms, ...)
    // will be registered here as they are built. See PRD §5 / §7.
  ],
})
export class AppModule {}
