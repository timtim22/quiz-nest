import { Test } from '@nestjs/testing';
import { ErrorCode } from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const prisma = { $queryRaw: vi.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('reports ok when the database answers', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toMatchObject({ status: 'ok', database: 'up' });
  });

  it('throws SERVICE_UNAVAILABLE when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const error = await controller.check().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect((error as AppException).getStatus()).toBe(503);
    expect((error as AppException).details).toEqual({ database: 'down' });
  });
});
