import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthSession } from '@quiz-nest/shared';
import request, { type Response } from 'supertest';
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
    'TRUNCATE TABLE audit_logs, system_settings, topics, chapters, subjects, password_reset_tokens, sessions, users, organizations RESTART IDENTITY CASCADE',
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

let teacherCount = 0;

/** Signs up a new teacher (with their own school) and returns their access token. */
export async function registerTeacher(
  app: NestExpressApplication,
  overrides: Partial<{ name: string; email: string; password: string; schoolName: string }> = {},
) {
  teacherCount += 1;
  const body = {
    name: `Teacher ${teacherCount}`,
    email: `teacher${teacherCount}-${Date.now()}@school.test`,
    password: 'secret123',
    schoolName: `School ${teacherCount}`,
    ...overrides,
  };
  const response = await request(app.getHttpServer()).post('/api/auth/register').send(body);
  if (response.status !== 201) {
    throw new Error(`registerTeacher failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  const { accessToken, user } = response.body.data as AuthSession;
  return { accessToken, user, email: body.email, password: body.password };
}

/** Signs up a teacher, makes them an admin, and logs in again so the token carries the new role. */
export async function registerAdmin(app: NestExpressApplication, prisma: PrismaService) {
  const { email, password, user } = await registerTeacher(app, { name: 'Admin User' });
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  const session = response.body.data as AuthSession;
  return { accessToken: session.accessToken, user: session.user, email, password };
}
