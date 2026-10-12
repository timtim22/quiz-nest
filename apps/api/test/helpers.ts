import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { MailService } from '../src/modules/mail/mail.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

interface TestAppOptions {
  /** Rate limits are off by default so tests can log in as often as they like. */
  rateLimits?: boolean;
}

/** The real app, wired to the test database, with emails captured instead of sent. */
export async function createTestApp({ rateLimits = false }: TestAppOptions = {}) {
  const mail = { sendPasswordReset: vi.fn() };

  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mail);
  if (!rateLimits)
    builder = builder.overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true });

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app, { corsOrigin: 'http://localhost:5173' });
  await app.init();

  return { app, mail, prisma: app.get(PrismaService) };
}

/** Deletes every row. Add new tables here as the schema grows. */
export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE password_reset_tokens, sessions, users, organizations RESTART IDENTITY CASCADE',
  );
}

/** The `name=value` part of a Set-Cookie header, ready to send back in a Cookie header. */
export function cookieFrom(response: Response, name: string): string | undefined {
  const header = response.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = header?.find((value) => value.startsWith(`${name}=`));
  return cookie?.split(';')[0];
}

/** The full Set-Cookie header for one cookie, to check its flags. */
export function setCookieHeader(response: Response, name: string): string | undefined {
  const header = response.headers['set-cookie'] as unknown as string[] | undefined;
  return header?.find((value) => value.startsWith(`${name}=`));
}
