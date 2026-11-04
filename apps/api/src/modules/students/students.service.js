var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { createStudentSchema, } from '@quiz-nest/shared';
import { AuditService } from '../audit/audit.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
const MAX_IMPORT_ROWS = 2000;
// Lets the CSV header be written several ways: "Roll No", "roll_number", "Parent Email"...
const HEADER_ALIASES = {
    rollnumber: 'rollNumber',
    rollno: 'rollNumber',
    rollnum: 'rollNumber',
    roll: 'rollNumber',
    name: 'name',
    studentname: 'name',
    fullname: 'name',
    class: 'className',
    classname: 'className',
    grade: 'className',
    section: 'section',
    parentemail: 'parentEmail',
    parentsemail: 'parentEmail',
    guardianemail: 'parentEmail',
    email: 'parentEmail',
};
const REQUIRED_COLUMNS = [
    { field: 'rollNumber', label: 'roll number' },
    { field: 'name', label: 'name' },
    { field: 'className', label: 'class' },
];
function toField(header) {
    return HEADER_ALIASES[header.toLowerCase().replace(/[^a-z]/g, '')] ?? false;
}
/** Two students clash when class, section and roll number are all the same. */
function keyOf(s) {
    return JSON.stringify([s.className, s.section ?? '', s.rollNumber]);
}
let StudentsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var StudentsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            StudentsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        audit;
        constructor(prisma, audit) {
            this.prisma = prisma;
            this.audit = audit;
        }
        async list(actor, query) {
            const where = { organizationId: actor.organizationId };
            if (query.className)
                where.className = query.className;
            if (query.section)
                where.section = query.section.toUpperCase();
            if (query.q) {
                where.OR = [
                    { name: { contains: query.q, mode: 'insensitive' } },
                    { rollNumber: { contains: query.q, mode: 'insensitive' } },
                    { parentEmail: { contains: query.q, mode: 'insensitive' } },
                ];
            }
            const [items, total] = await this.prisma.$transaction([
                this.prisma.student.findMany({
                    where,
                    orderBy: [{ className: 'asc' }, { section: 'asc' }, { rollNumber: 'asc' }],
                    skip: (query.page - 1) * query.pageSize,
                    take: query.pageSize,
                }),
                this.prisma.student.count({ where }),
            ]);
            return { items, total, page: query.page, pageSize: query.pageSize };
        }
        async findOne(actor, id) {
            const student = await this.prisma.student.findFirst({
                where: { id, organizationId: actor.organizationId },
            });
            if (!student)
                throw new NotFoundException('Student not found');
            return student;
        }
        async create(actor, input) {
            try {
                const student = await this.prisma.student.create({
                    data: {
                        organizationId: actor.organizationId,
                        rollNumber: input.rollNumber,
                        name: input.name,
                        className: input.className,
                        section: input.section, // undefined -> database default ""
                        parentEmail: input.parentEmail || null,
                    },
                });
                await this.audit.record({
                    // ADJUST to your AuditService.record() signature
                    actorId: actor.id,
                    action: 'student.created',
                    entityType: 'Student',
                    entityId: student.id,
                });
                return student;
            }
            catch (error) {
                throw this.toHttpError(error);
            }
        }
        async update(actor, id, input) {
            await this.findOne(actor, id); // 404 if it isn't in this organization
            try {
                const student = await this.prisma.student.update({
                    where: { id },
                    data: {
                        rollNumber: input.rollNumber,
                        name: input.name,
                        className: input.className,
                        section: input.section,
                        // undefined = leave unchanged, ""/null = clear it
                        parentEmail: input.parentEmail === undefined ? undefined : input.parentEmail || null,
                    },
                });
                await this.audit.record({
                    actorId: actor.id,
                    action: 'student.updated',
                    entityType: 'Student',
                    entityId: id,
                    metadata: { fields: Object.keys(input) },
                });
                return student;
            }
            catch (error) {
                throw this.toHttpError(error);
            }
        }
        async remove(actor, id) {
            const student = await this.findOne(actor, id);
            await this.prisma.student.delete({ where: { id } });
            await this.audit.record({
                actorId: actor.id,
                action: 'student.deleted',
                entityType: 'Student',
                entityId: id,
                metadata: {
                    rollNumber: student.rollNumber,
                    name: student.name,
                    className: student.className,
                    section: student.section,
                },
            });
        }
        /**
         * Imports a CSV. Good rows are saved; bad or duplicate rows are skipped and
         * reported back with their row number, so the teacher can fix and re-upload.
         */
        async importCsv(actor, file) {
            let headers = [];
            let records;
            try {
                records = parse(file, {
                    columns: (header) => (headers = header.map(toField)),
                    bom: true, // Excel adds an invisible marker at the start of CSV files
                    skip_empty_lines: true,
                    trim: true,
                    relax_column_count: true,
                });
            }
            catch {
                throw new BadRequestException('Could not read the file. Is it a valid CSV?');
            }
            const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c.field));
            if (missing.length > 0) {
                throw new BadRequestException(`Missing required column(s): ${missing.map((c) => c.label).join(', ')}. ` +
                    'Expected columns: roll number, name, class, section, parent email.');
            }
            if (records.length === 0)
                throw new BadRequestException('The file has no student rows.');
            if (records.length > MAX_IMPORT_ROWS) {
                throw new BadRequestException(`Too many rows (max ${MAX_IMPORT_ROWS}). Split the file and import it in parts.`);
            }
            const errors = [];
            // 1. Validate every row with the same schema used for manual add.
            const valid = [];
            records.forEach((record, index) => {
                const row = index + 2; // +1 for the header line, +1 because lines start at 1
                const parsed = createStudentSchema.safeParse(record);
                if (parsed.success) {
                    valid.push({ row, data: parsed.data });
                }
                else {
                    const message = parsed.error.issues
                        .map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`)
                        .join('; ');
                    errors.push({ row, message });
                }
            });
            // 2. Find students that already exist in the database for these classes.
            const classNames = [...new Set(valid.map((v) => v.data.className))];
            const existing = await this.prisma.student.findMany({
                where: { organizationId: actor.organizationId, className: { in: classNames } },
                select: { className: true, section: true, rollNumber: true },
            });
            const existingKeys = new Set(existing.map(keyOf));
            // 3. Skip duplicates (against the database and within the file itself).
            const seen = new Set();
            const toInsert = [];
            for (const { row, data } of valid) {
                const key = keyOf(data);
                if (seen.has(key)) {
                    errors.push({ row, message: 'Duplicate of an earlier row in this file' });
                    continue;
                }
                seen.add(key);
                if (existingKeys.has(key)) {
                    errors.push({
                        row,
                        message: 'A student with this roll number already exists in that class and section',
                    });
                    continue;
                }
                toInsert.push({
                    organizationId: actor.organizationId,
                    rollNumber: data.rollNumber,
                    name: data.name,
                    className: data.className,
                    section: data.section ?? '',
                    parentEmail: data.parentEmail || null,
                });
            }
            // 4. Save. skipDuplicates covers the rare case of a clash created mid-import.
            let created = 0;
            if (toInsert.length > 0) {
                const result = await this.prisma.student.createMany({
                    data: toInsert,
                    skipDuplicates: true,
                });
                created = result.count;
            }
            await this.audit.record({
                actorId: actor.id,
                action: 'student.imported',
                entityType: 'Student',
                metadata: { created, skipped: errors.length },
            });
            errors.sort((a, b) => a.row - b.row);
            return { created, skipped: errors.length, errors };
        }
        /** Turns Prisma's unique-constraint error into a friendly 409. */
        toHttpError(error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return new ConflictException('A student with this roll number already exists in that class and section.');
            }
            return error;
        }
    };
    return StudentsService = _classThis;
})();
export { StudentsService };
//# sourceMappingURL=students.service.js.map