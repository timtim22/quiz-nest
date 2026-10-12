import type { NestExpressApplication } from '@nestjs/platform-express';
import { ErrorCode } from '@quiz-nest/shared';
import request from 'supertest';
import { REFRESH_COOKIE } from '../src/modules/auth/auth.constants.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { cookieFrom, createTestApp, resetDatabase, setCookieHeader } from './helpers.js';

const teacher = {
  name: 'Ayesha Khan',
  email: 'ayesha@cityschool.pk',
  password: 'secret123',
  schoolName: 'City School',
};

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let mail: { sendPasswordReset: ReturnType<typeof vi.fn> };

  const api = () => request(app.getHttpServer());
  const register = (body: object = teacher) => api().post('/api/auth/register').send(body);
  const login = (email = teacher.email, password = teacher.password) =>
    api().post('/api/auth/login').send({ email, password });
  const refresh = (cookie?: string) => {
    const req = api().post('/api/auth/refresh');
    return cookie ? req.set('Cookie', cookie) : req;
  };
  const me = (accessToken?: string) => {
    const req = api().get('/api/auth/me');
    return accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req;
  };

  beforeAll(async () => {
    ({ app, prisma, mail } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    mail.sendPasswordReset.mockReset();
    vi.useRealTimers();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('register', () => {
    it('creates a teacher and their school, and logs them in', async () => {
      const response = await register({ ...teacher, email: '  Ayesha@CitySchool.PK ' }).expect(201);

      expect(response.body.data).toMatchObject({
        accessToken: expect.any(String),
        user: {
          name: 'Ayesha Khan',
          email: 'ayesha@cityschool.pk',
          role: 'TEACHER',
          organizationName: 'City School',
        },
      });

      const cookie = setCookieHeader(response, REFRESH_COOKIE);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
      expect(cookie).toMatch(/Path=\/api\/auth/i);
    });

    it('stores a bcrypt hash, never the password', async () => {
      await register().expect(201);

      const user = await prisma.user.findUniqueOrThrow({ where: { email: teacher.email } });
      expect(user.passwordHash).toMatch(/^\$2b\$12\$/);
      expect(user.passwordHash).not.toContain(teacher.password);
    });

    it('always makes a teacher, even if the request asks for admin', async () => {
      const response = await register({ ...teacher, role: 'ADMIN' }).expect(201);

      expect(response.body.data.user.role).toBe('TEACHER');
    });

    it('rejects an email that is already registered', async () => {
      await register().expect(201);
      const response = await register({ ...teacher, email: teacher.email.toUpperCase() }).expect(
        409,
      );

      expect(response.body.error.code).toBe(ErrorCode.EMAIL_ALREADY_REGISTERED);
    });

    it('lists every invalid field', async () => {
      const response = await register({ name: '', email: 'nope', password: 'short' }).expect(400);

      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      const paths = response.body.error.details.map((issue: { path: string }) => issue.path);
      expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password', 'schoolName']));
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await register().expect(201);
    });

    it('returns an access token that works on protected routes', async () => {
      const response = await login().expect(200);
      expect(cookieFrom(response, REFRESH_COOKIE)).toBeDefined();

      const profile = await me(response.body.data.accessToken).expect(200);
      expect(profile.body.data.email).toBe(teacher.email);
    });

    it('gives the same error for a wrong password and an unknown email', async () => {
      const wrongPassword = await login(teacher.email, 'wrong-pass1').expect(401);
      const unknownEmail = await login('nobody@cityschool.pk', 'wrong-pass1').expect(401);

      expect(wrongPassword.body.error).toEqual(unknownEmail.body.error);
      expect(wrongPassword.body.error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    });

    it('blocks disabled accounts', async () => {
      await prisma.user.update({ where: { email: teacher.email }, data: { status: 'DISABLED' } });

      const response = await login().expect(403);
      expect(response.body.error.code).toBe(ErrorCode.ACCOUNT_DISABLED);
    });
  });

  describe('protected routes', () => {
    it('reject requests without a token', async () => {
      const response = await me().expect(401);
      expect(response.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('reject a forged token', async () => {
      await me('not-a-real-token').expect(401);
    });

    it('leave public routes open', async () => {
      await api().get('/api/health').expect(200);
    });
  });

  describe('refresh (staying logged in)', () => {
    it('swaps the cookie for a new one and a new access token', async () => {
      const cookie = cookieFrom(await register().expect(201), REFRESH_COOKIE);

      const response = await refresh(cookie).expect(200);

      expect(response.body.data.user.email).toBe(teacher.email);
      const newCookie = cookieFrom(response, REFRESH_COOKIE);
      expect(newCookie).toBeDefined();
      expect(newCookie).not.toBe(cookie);
      await me(response.body.data.accessToken).expect(200);
    });

    it('answers "not logged in" without an error when there is no cookie', async () => {
      const response = await refresh().expect(200);
      expect(response.body).toEqual({ success: true, data: null });
    });

    it('rejects an unknown cookie and clears it', async () => {
      const response = await refresh(`${REFRESH_COOKIE}=made-up`).expect(401);
      expect(setCookieHeader(response, REFRESH_COOKIE)).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('allows an old cookie briefly (two tabs), but treats later reuse as theft', async () => {
      const oldCookie = cookieFrom(await register().expect(201), REFRESH_COOKIE);
      const newCookie = cookieFrom(await refresh(oldCookie).expect(200), REFRESH_COOKIE);

      // Another tab still has the old cookie a moment later: fine.
      await refresh(oldCookie).expect(200);

      // A minute later, the old cookie shows up again: log out everywhere.
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 60_000);
      await refresh(oldCookie).expect(401);
      await refresh(newCookie).expect(401);
    });
  });

  describe('logout', () => {
    it('ends the session and clears the cookie', async () => {
      const cookie = cookieFrom(await register().expect(201), REFRESH_COOKIE);

      const response = await api().post('/api/auth/logout').set('Cookie', cookie!).expect(200);

      expect(setCookieHeader(response, REFRESH_COOKIE)).toMatch(/Expires=Thu, 01 Jan 1970/);
      await refresh(cookie).expect(401);
    });
  });

  describe('forgot and reset password', () => {
    const forgot = (email: string) => api().post('/api/auth/forgot-password').send({ email });
    const reset = (token: string, password: string) =>
      api().post('/api/auth/reset-password').send({ token, password });

    /** Pulls the token out of the link in the captured email. */
    const tokenFromEmail = () => {
      const { link } = mail.sendPasswordReset.mock.calls.at(-1)![0] as { link: string };
      expect(link).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=/);
      return new URL(link).searchParams.get('token')!;
    };

    it('answers the same way for unknown emails, and sends nothing', async () => {
      const response = await forgot('nobody@cityschool.pk').expect(200);

      expect(response.body).toEqual({ success: true, data: null });
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('resets the password with the emailed link and logs out other devices', async () => {
      const oldCookie = cookieFrom(await register().expect(201), REFRESH_COOKIE);

      await forgot(teacher.email).expect(200);
      await reset(tokenFromEmail(), 'brandnew99').expect(200);

      await login(teacher.email, teacher.password).expect(401);
      await login(teacher.email, 'brandnew99').expect(200);
      await refresh(oldCookie).expect(401);
    });

    it('only lets a link be used once', async () => {
      await register().expect(201);
      await forgot(teacher.email).expect(200);
      const token = tokenFromEmail();

      await reset(token, 'brandnew99').expect(200);
      const response = await reset(token, 'another99').expect(400);
      expect(response.body.error.code).toBe(ErrorCode.INVALID_RESET_TOKEN);
    });

    it('expires links after an hour', async () => {
      await register().expect(201);
      await forgot(teacher.email).expect(200);
      const token = tokenFromEmail();

      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 61 * 60_000);
      await reset(token, 'brandnew99').expect(400);
    });

    it('only accepts the newest link', async () => {
      await register().expect(201);
      await forgot(teacher.email).expect(200);
      const firstToken = tokenFromEmail();
      await forgot(teacher.email).expect(200);

      await reset(firstToken, 'brandnew99').expect(400);
      await reset(tokenFromEmail(), 'brandnew99').expect(200);
    });
  });
});

describe('Auth rate limits (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const testApp = await createTestApp({ rateLimits: true });
    app = testApp.app;
    await resetDatabase(testApp.prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks the 6th login attempt in a minute', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'someone@school.pk', password: 'guess1234' });

    for (let i = 0; i < 5; i++) await attempt().expect(401);
    const response = await attempt().expect(429);

    expect(response.body.error.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
  });
});
