import { type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';
/**
 * The database client. Inject it into any service:
 *
 *   constructor(private readonly prisma: PrismaService) {}
 *
 * Connections open lazily on the first query, so the API can start (and report
 * the problem on /api/health) even when the database is down.
 */
export declare class PrismaService extends PrismaClient implements OnModuleDestroy {
    constructor(config: ConfigService<Env, true>);
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=prisma.service.d.ts.map