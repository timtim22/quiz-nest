import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

export const API_PREFIX = 'api';
const MAX_BODY_SIZE = '1mb';

interface AppSetupOptions {
  /** Comma-separated list of allowed browser origins. */
  corsOrigin: string;
}

/**
 * HTTP-level setup shared by `main.ts` and the e2e tests, so tests run against
 * the same prefix, security headers and body limits as the real server.
 */
export function configureApp(app: NestExpressApplication, options: AppSetupOptions) {
  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.enableCors({
    origin: options.corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  app.useBodyParser('json', { limit: MAX_BODY_SIZE });
  app.useBodyParser('urlencoded', { limit: MAX_BODY_SIZE, extended: true });
  app.enableShutdownHooks();
}
