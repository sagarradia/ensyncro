import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Shared application configuration, applied by both the local bootstrap
 * (main.ts) and the Vercel serverless entrypoint (serverless.ts), so the two
 * never drift apart.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: config.get<string[]>('corsOrigin'), credentials: true });
}
