import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction, AuditLogEntryDto, Paginated, PaginationQuery } from '@quiz-nest/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuditEntry {
  /** The user who did it. Leave out for system actions. */
  actorId?: string | null;
  action: AuditAction;
  /** What kind of thing was affected, e.g. 'User', 'Exam'. */
  entityType: string;
  entityId?: string | null;
  /** Anything useful later, e.g. { email } of a removed user or { from, to } of a change. */
  metadata?: Record<string, unknown>;
}

/**
 * The audit log: who did what, and when. Any module can inject this and call:
 *
 *   await this.audit.record({ actorId: user.id, action: AuditAction.EXAM_PUBLISHED, entityType: 'Exam', entityId: exam.id });
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Never throws: if the log can't be written, the error is logged and the action still succeeds. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Could not write audit entry ${entry.action}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Newest first. */
  async list({ page, pageSize }: PaginationQuery): Promise<Paginated<AuditLogEntryDto>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        // ids are time-ordered (UUID v7), so they break ties within the same millisecond.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
        actor: row.actor,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
