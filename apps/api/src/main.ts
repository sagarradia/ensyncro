import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

// Local / long-running bootstrap (nest start). On Vercel the app is served
// through the serverless entrypoint instead — see api/index.ts + serverless.ts.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);

  new Logger('Bootstrap').log(
    `Ensyncro API [${config.get('appEnv')}] listening on port ${port}`,
  );
}

bootstrap();
