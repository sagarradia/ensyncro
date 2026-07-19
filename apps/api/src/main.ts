import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: config.get<string[]>('corsOrigin'), credentials: true });

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Ensyncro API [${config.get('appEnv')}] listening on port ${port}`);
}

bootstrap();
