import type { AuditAction, AuditLogEntryDto, Paginated, PaginationQuery } from '@quiz-nest/shared';
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
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /** Never throws: if the log can't be written, the error is logged and the action still succeeds. */
    record(entry: AuditEntry): Promise<void>;
    /** Newest first. */
    list({ page, pageSize }: PaginationQuery): Promise<Paginated<AuditLogEntryDto>>;
}
//# sourceMappingURL=audit.service.d.ts.map