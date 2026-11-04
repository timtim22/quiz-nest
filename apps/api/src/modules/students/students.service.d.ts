import { type CreateStudentInput, type ImportStudentsResult, type ListStudentsQuery, type UpdateStudentInput } from '@quiz-nest/shared';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
/** The logged-in user, as far as this module cares. */
export interface Actor {
    id: string;
    organizationId: string;
}
export declare class StudentsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    list(actor: Actor, query: ListStudentsQuery): Promise<{
        items: {
            name: string;
            rollNumber: string;
            className: string;
            parentEmail: string | null;
            section: string;
            id: string;
            createdAt: Date;
            organizationId: string;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(actor: Actor, id: string): Promise<{
        name: string;
        rollNumber: string;
        className: string;
        parentEmail: string | null;
        section: string;
        id: string;
        createdAt: Date;
        organizationId: string;
        updatedAt: Date;
    }>;
    create(actor: Actor, input: CreateStudentInput): Promise<{
        name: string;
        rollNumber: string;
        className: string;
        parentEmail: string | null;
        section: string;
        id: string;
        createdAt: Date;
        organizationId: string;
        updatedAt: Date;
    }>;
    update(actor: Actor, id: string, input: UpdateStudentInput): Promise<{
        name: string;
        rollNumber: string;
        className: string;
        parentEmail: string | null;
        section: string;
        id: string;
        createdAt: Date;
        organizationId: string;
        updatedAt: Date;
    }>;
    remove(actor: Actor, id: string): Promise<void>;
    /**
     * Imports a CSV. Good rows are saved; bad or duplicate rows are skipped and
     * reported back with their row number, so the teacher can fix and re-upload.
     */
    importCsv(actor: Actor, file: Buffer): Promise<ImportStudentsResult>;
    /** Turns Prisma's unique-constraint error into a friendly 409. */
    private toHttpError;
}
//# sourceMappingURL=students.service.d.ts.map