import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ErrorCode } from '@quiz-nest/shared';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: vi.fn().mockResolvedValue([]), $disconnect: vi.fn() })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, { corsOrigin: 'http://localhost:5173' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps successful responses in { success: true, data }', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toMatchObject({ success: true, data: { status: 'ok', database: 'up' } });
  });

  it('returns the standard error shape for unknown routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/does-not-exist').expect(404);

    expect(response.body).toEqual({
      success: false,
      error: { code: ErrorCode.NOT_FOUND, message: expect.any(String) },
    });
  });

  it('rejects request bodies over the size limit', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ blob: 'x'.repeat(2 * 1024 * 1024) }))
      .expect(413);

    expect(response.body.error.code).toBe(ErrorCode.PAYLOAD_TOO_LARGE);
  });

  it('sets security headers', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
