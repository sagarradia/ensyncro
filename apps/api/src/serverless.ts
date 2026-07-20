import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

let cached: Express | undefined;

/**
 * Boots the Nest application on a bare Express instance and returns it WITHOUT
 * calling listen() — for use inside a serverless function. The instance is
 * cached across invocations so the app initializes once per warm container.
 *
 * Lives in src/ so `nest build` compiles it (with correct decorator metadata)
 * to dist/serverless.js, which the Vercel function imports.
 */
export async function bootstrapServer(): Promise<Express> {
  if (cached) return cached;
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  configureApp(app);
  await app.init();
  cached = expressApp;
  return cached;
}
