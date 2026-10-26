import type { NestExpressApplication } from '@nestjs/platform-express';
import { ErrorCode, type SubjectDetailDto } from '@quiz-nest/shared';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, registerTeacher, resetDatabase } from './helpers.js';

describe('Subjects, chapters and topics (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;

  /** Requests as the logged-in teacher (or as someone else, if a token is given). */
  const as = (accessToken = token) => {
    const server = app.getHttpServer();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);
    return {
      get: (url: string) => auth(request(server).get(`/api${url}`)),
      post: (url: string, body: object) => auth(request(server).post(`/api${url}`).send(body)),
      patch: (url: string, body: object) => auth(request(server).patch(`/api${url}`).send(body)),
      delete: (url: string) => auth(request(server).delete(`/api${url}`)),
    };
  };

  const createSubject = async (name = 'Physics') =>
    (await as().post('/subjects', { name }).expect(201)).body.data.id as string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ({ accessToken: token } = await registerTeacher(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('builds a subject → chapter → topic tree in order', async () => {
    const subjectId = await createSubject();
    const motion = (
      await as().post(`/subjects/${subjectId}/chapters`, { name: 'Motion' }).expect(201)
    ).body.data;
    await as().post(`/subjects/${subjectId}/chapters`, { name: 'Forces' }).expect(201);
    await as().post(`/chapters/${motion.id}/topics`, { name: 'Speed' }).expect(201);
    await as().post(`/chapters/${motion.id}/topics`, { name: 'Velocity' }).expect(201);

    const detail = (await as().get(`/subjects/${subjectId}`).expect(200)).body
      .data as SubjectDetailDto;

    expect(detail.name).toBe('Physics');
    expect(detail.chapters.map((c) => c.name)).toEqual(['Motion', 'Forces']);
    expect(detail.chapters[0].topics.map((t) => t.name)).toEqual(['Speed', 'Velocity']);

    const list = (await as().get('/subjects').expect(200)).body.data;
    expect(list).toEqual([expect.objectContaining({ name: 'Physics', chapterCount: 2 })]);
  });

  it('renames subjects, chapters and topics', async () => {
    const subjectId = await createSubject();
    const chapter = (
      await as().post(`/subjects/${subjectId}/chapters`, { name: 'Motoin' }).expect(201)
    ).body.data;
    const topic = (await as().post(`/chapters/${chapter.id}/topics`, { name: 'Sped' }).expect(201))
      .body.data;

    await as()
      .patch(`/subjects/${subjectId}`, { name: 'Physics 9', description: 'Grade 9' })
      .expect(200);
    await as().patch(`/chapters/${chapter.id}`, { name: 'Motion' }).expect(200);
    await as().patch(`/topics/${topic.id}`, { name: 'Speed' }).expect(200);

    const detail = (await as().get(`/subjects/${subjectId}`).expect(200)).body
      .data as SubjectDetailDto;
    expect(detail).toMatchObject({ name: 'Physics 9', description: 'Grade 9' });
    expect(detail.chapters[0]).toMatchObject({ name: 'Motion', topics: [{ name: 'Speed' }] });
  });

  it('rejects duplicate names in the same place, but allows them elsewhere', async () => {
    const physics = await createSubject('Physics');
    const chemistry = await createSubject('Chemistry');

    const dupSubject = await as().post('/subjects', { name: 'Physics' }).expect(409);
    expect(dupSubject.body.error.code).toBe(ErrorCode.CONFLICT);

    await as().post(`/subjects/${physics}/chapters`, { name: 'Introduction' }).expect(201);
    await as().post(`/subjects/${physics}/chapters`, { name: 'Introduction' }).expect(409);
    await as().post(`/subjects/${chemistry}/chapters`, { name: 'Introduction' }).expect(201);
  });

  it('deleting a subject also deletes its chapters and topics', async () => {
    const subjectId = await createSubject();
    const chapter = (
      await as().post(`/subjects/${subjectId}/chapters`, { name: 'Motion' }).expect(201)
    ).body.data;
    await as().post(`/chapters/${chapter.id}/topics`, { name: 'Speed' }).expect(201);

    const response = await as().delete(`/subjects/${subjectId}`).expect(200);

    expect(response.body).toEqual({ success: true, data: null });
    await as().get(`/subjects/${subjectId}`).expect(404);
    expect(await prisma.chapter.count()).toBe(0);
    expect(await prisma.topic.count()).toBe(0);
  });

  it('never shows or changes another school’s data', async () => {
    const subjectId = await createSubject();
    const chapter = (
      await as().post(`/subjects/${subjectId}/chapters`, { name: 'Motion' }).expect(201)
    ).body.data;
    const topic = (await as().post(`/chapters/${chapter.id}/topics`, { name: 'Speed' }).expect(201))
      .body.data;
    const other = await registerTeacher(app);

    expect((await as(other.accessToken).get('/subjects').expect(200)).body.data).toEqual([]);
    await as(other.accessToken).get(`/subjects/${subjectId}`).expect(404);
    await as(other.accessToken).patch(`/subjects/${subjectId}`, { name: 'Mine now' }).expect(404);
    await as(other.accessToken)
      .post(`/subjects/${subjectId}/chapters`, { name: 'Sneaky' })
      .expect(404);
    await as(other.accessToken).patch(`/chapters/${chapter.id}`, { name: 'Sneaky' }).expect(404);
    await as(other.accessToken).delete(`/topics/${topic.id}`).expect(404);

    const detail = (await as().get(`/subjects/${subjectId}`).expect(200)).body
      .data as SubjectDetailDto;
    expect(detail.chapters[0]).toMatchObject({ name: 'Motion', topics: [{ name: 'Speed' }] });
  });

  it('answers 404 for a malformed id instead of crashing', async () => {
    const response = await as().get('/subjects/not-a-real-id').expect(404);
    expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('lists every invalid field', async () => {
    const response = await as().post('/subjects', { name: '   ' }).expect(400);
    expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(response.body.error.details).toEqual([{ path: 'name', message: 'Enter a name.' }]);
  });

  it('needs a login', async () => {
    await request(app.getHttpServer()).get('/api/subjects').expect(401);
  });
});
