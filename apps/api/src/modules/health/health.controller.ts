import { Controller, Get, HttpStatus, Logger } from '@nestjs/common';
import { ErrorCode, type HealthStatus } from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/health: is the API up, and can it reach the database? */
  @Get()
  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.warn(`Database check failed: ${error instanceof Error ? error.message : error}`);
      throw new AppException(
        ErrorCode.SERVICE_UNAVAILABLE,
        'The database is not reachable.',
        HttpStatus.SERVICE_UNAVAILABLE,
        { database: 'down' },
      );
    }

    return {
      status: 'ok',
      database: 'up',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
