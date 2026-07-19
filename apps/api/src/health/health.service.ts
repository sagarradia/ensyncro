import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type DbStatus = 'up' | 'down' | 'not-configured';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async check() {
    return {
      status: 'ok',
      service: 'ensyncro-api',
      env: this.config.get<string>('appEnv'),
      db: await this.dbStatus(),
      time: new Date().toISOString(),
    };
  }

  /**
   * Reports DB connectivity without failing the health check when the
   * database is not yet wired up. DATABASE_URL is injected per-environment
   * by Vercel's Neon integration; locally it is often unset.
   */
  private async dbStatus(): Promise<DbStatus> {
    if (!process.env.DATABASE_URL) return 'not-configured';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
