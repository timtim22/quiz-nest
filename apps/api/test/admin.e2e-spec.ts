import type { NestExpressApplication } from '@nestjs/platform-express';
import { AuditAction, ErrorCode } from '@quiz-nest/shared';
import request from 'supertest';
import { REFRESH_COOKIE } from '../src/modules/auth/auth.constants.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import {
  cookieFrom,
  createTestApp,
  registerAdmin,
  registerTeacher,
  resetDatabase,
} from './helpers.js';

describe('Admin (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: Awaited<ReturnType<typeof registerAdmin>>;

  const api = () => request(app.getHttpServer());
  const as = (token: string) => ({
    get: (url: string) => api().get(`/api${url}`).set('Authorization', `Bearer ${token}`),
    post: (url: string, body: object = {}) =>
      api().post(`/api${url}`).set('Authorization', `Bearer ${token}`).send(body),
    patch: (url: string, body: object) =>
      api().patch(`/api${url}`).set('Authorization', `Bearer ${token}`).send(body),
    delete: (url: string) => api().delete(`/api${url}`).set('Authorization', `Bearer ${token}`),
  });
  const login = (email: string, password: string) =>
    api().post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = await registerAdmin(app, prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('is for admins only', async () => {
    const teacher = await registerTeacher(app);

    const response = await as(teacher.accessToken).get('/admin/users').expect(403);
    expect(response.body.error.code).toBe(ErrorCode.FORBIDDEN);
    await as(teacher.accessToken).get('/admin/stats').expect(403);
    await as(teacher.accessToken).post(`/admin/users/${teacher.user.id}/approve`).expect(403);
    await api().get('/api/admin/stats').expect(401);
  });

  it('lists users with search and status filters', async () => {
    await registerTeacher(app, { name: 'Ayesha Khan' });
    await registerTeacher(app, { name: 'Bilal Ahmed' });

    const all = (await as(admin.accessToken).get('/admin/users').expect(200)).body.data;
    expect(all.total).toBe(3);

    const search = (await as(admin.accessToken).get('/admin/users?search=ayesha').expect(200)).body
      .data;
    expect(search.items.map((u: { name: string }) => u.name)).toEqual(['Ayesha Khan']);
    expect(search.items[0]).toMatchObject({ role: 'TEACHER', status: 'ACTIVE' });

    const pending = (await as(admin.accessToken).get('/admin/users?status=PENDING').expect(200))
      .body.data;
    expect(pending.total).toBe(0);
  });

  it('holds new teachers for approval when the setting is on', async () => {
    await as(admin.accessToken)
      .patch('/admin/settings', { requireTeacherApproval: true })
      .expect(200);

    const signup = await api()
      .post('/api/auth/register')
      .send({
        name: 'New Teacher',
        email: 'new@school.test',
        password: 'secret123',
        schoolName: 'New School',
      })
      .expect(202);
    expect(signup.body.data).toEqual({ pendingApproval: true, email: 'new@school.test' });
    expect(cookieFrom(signup, REFRESH_COOKIE)).toBeUndefined();

    const blocked = await login('new@school.test', 'secret123').expect(403);
    expect(blocked.body.error.code).toBe(ErrorCode.ACCOUNT_PENDING);

    const pending = (await as(admin.accessToken).get('/admin/users?status=PENDING').expect(200))
      .body.data;
    expect(pending.items).toHaveLength(1);
    const id = pending.items[0].id;

    await as(admin.accessToken).post(`/admin/users/${id}/approve`).expect(200);
    await login('new@school.test', 'secret123').expect(200);
    await as(admin.accessToken).post(`/admin/users/${id}/approve`).expect(409);
  });

  it('a disabled teacher is logged out and cannot log in until enabled', async () => {
    const teacher = await registerTeacher(app);
    const cookie = cookieFrom(
      await login(teacher.email, teacher.password).expect(200),
      REFRESH_COOKIE,
    );

    const disabled = await as(admin.accessToken)
      .post(`/admin/users/${teacher.user.id}/disable`)
      .expect(200);
    expect(disabled.body.data.status).toBe('DISABLED');

    const blocked = await login(teacher.email, teacher.password).expect(403);
    expect(blocked.body.error.code).toBe(ErrorCode.ACCOUNT_DISABLED);
    await api().post('/api/auth/refresh').set('Cookie', cookie!).expect(401);

    await as(admin.accessToken).post(`/admin/users/${teacher.user.id}/enable`).expect(200);
    await login(teacher.email, teacher.password).expect(200);
  });

  it('removes a user but keeps the audit trail', async () => {
    const teacher = await registerTeacher(app);

    await as(admin.accessToken).delete(`/admin/users/${teacher.user.id}`).expect(200);

    await login(teacher.email, teacher.password).expect(401);
    const log = (await as(admin.accessToken).get('/admin/audit-logs').expect(200)).body.data;
    expect(log.items[0]).toMatchObject({
      action: AuditAction.USER_REMOVED,
      entityId: teacher.user.id,
      metadata: { email: teacher.email },
      actor: { id: admin.user.id },
    });
    // The teacher's own sign-up entry stays, with the actor cleared.
    const signup = log.items.find(
      (e: { action: string; entityId: string }) =>
        e.action === AuditAction.USER_REGISTERED && e.entityId === teacher.user.id,
    );
    expect(signup.actor).toBeNull();
  });

  it("won't let an admin disable or remove their own account", async () => {
    await as(admin.accessToken).post(`/admin/users/${admin.user.id}/disable`).expect(400);
    await as(admin.accessToken).delete(`/admin/users/${admin.user.id}`).expect(400);
  });

  it('counts teachers, schools and subjects', async () => {
    const teacher = await registerTeacher(app);
    await registerTeacher(app);
    await as(teacher.accessToken).post('/subjects', { name: 'Physics' }).expect(201);
    await as(admin.accessToken).post(`/admin/users/${teacher.user.id}/disable`).expect(200);

    const stats = (await as(admin.accessToken).get('/admin/stats').expect(200)).body.data;

    expect(stats).toEqual({
      teachers: { active: 1, pending: 0, disabled: 1 },
      admins: 1,
      organizations: 3,
      subjects: 1,
    });
  });

  it('records important actions in the audit log, newest first', async () => {
    const teacher = await registerTeacher(app);
    await as(admin.accessToken).post(`/admin/users/${teacher.user.id}/disable`).expect(200);

    const log = (await as(admin.accessToken).get('/admin/audit-logs?pageSize=3').expect(200)).body
      .data;

    expect(log.items.map((e: { action: string }) => e.action)).toEqual([
      AuditAction.USER_DISABLED,
      AuditAction.USER_REGISTERED,
      AuditAction.USER_LOGGED_IN,
    ]);
    expect(log.pageSize).toBe(3);
  });
});
