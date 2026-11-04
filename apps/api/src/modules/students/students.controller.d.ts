import { StudentsService } from './students.service.js';
export declare class StudentsController {
    private readonly students;
    constructor(students: StudentsService);
    list(req: {
        user?: unknown;
    }, query: Record<string, unknown>): Promise<{
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
    create(req: {
        user?: unknown;
    }, body: unknown): Promise<{
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
    importCsv(req: {
        user?: unknown;
    }, file?: Express.Multer.File): Promise<import("@quiz-nest/shared").ImportStudentsResult>;
    findOne(req: {
        user?: unknown;
    }, id: string): Promise<{
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
    update(req: {
        user?: unknown;
    }, id: string, body: unknown): Promise<{
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
    remove(req: {
        user?: unknown;
    }, id: string): Promise<void>;
}
//# sourceMappingURL=students.controller.d.ts.map