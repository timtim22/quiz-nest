import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config: ConfigService<Env, true> = app.get(ConfigService);

  configureApp(app, { corsOrigin: config.get('CORS_ORIGIN', { infer: true }) });

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API ready at http://localhost:${port}/api`, 'Bootstrap');
}

await bootstrap();
