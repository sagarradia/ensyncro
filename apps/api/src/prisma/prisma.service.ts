import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around PrismaClient wired into the Nest lifecycle.
 * The datasource URL comes from DATABASE_URL (see prisma/schema.prisma);
 * nothing is hardcoded here.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL is not set. Skipping DB connection. ' +
          'It is injected per-environment by Vercel\'s Neon integration.',
      );
      return;
    }
    await this.$connect();
    this.logger.log('Connected to the database.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
