import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import {
  createStudentSchema,
  type CreateStudentInput,
  type ImportStudentsResult,
  type ListStudentsQuery,
  type UpdateStudentInput,
} from '@quiz-nest/shared';
import { AuditService } from '../audit/audit.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** The logged-in user, as far as this module cares. */
export interface Actor {
  id: string;
  organizationId: string;
}

const MAX_IMPORT_ROWS = 2000;

type Field = 'rollNumber' | 'name' | 'className' | 'section' | 'parentEmail';

// Lets the CSV header be written several ways: "Roll No", "roll_number", "Parent Email"...
const HEADER_ALIASES: Record<string, Field> = {
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

const REQUIRED_COLUMNS: { field: Field; label: string }[] = [
  { field: 'rollNumber', label: 'roll number' },
  { field: 'name', label: 'name' },
  { field: 'className', label: 'class' },
];

function toField(header: string): Field | false {
  return HEADER_ALIASES[header.toLowerCase().replace(/[^a-z]/g, '')] ?? false;
}

/** Two students clash when class, section and roll number are all the same. */
function keyOf(s: { className: string; section?: string | null; rollNumber: string }): string {
  return JSON.stringify([s.className, s.section ?? '', s.rollNumber]);
}

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: Actor, query: ListStudentsQuery) {
    const where: Prisma.StudentWhereInput = { organizationId: actor.organizationId };
    if (query.className) where.className = query.className;
    if (query.section) where.section = query.section.toUpperCase();
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

  async findOne(actor: Actor, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(actor: Actor, input: CreateStudentInput) {
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
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  async update(actor: Actor, id: string, input: UpdateStudentInput) {
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
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  async remove(actor: Actor, id: string) {
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
  async importCsv(actor: Actor, file: Buffer): Promise<ImportStudentsResult> {
    let headers: (Field | false)[] = [];
    let records: Record<string, string>[];
    try {
      records = parse(file, {
        columns: (header: string[]) => (headers = header.map(toField)),
        bom: true, // Excel adds an invisible marker at the start of CSV files
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch {
      throw new BadRequestException('Could not read the file. Is it a valid CSV?');
    }

    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c.field));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required column(s): ${missing.map((c) => c.label).join(', ')}. ` +
          'Expected columns: roll number, name, class, section, parent email.',
      );
    }
    if (records.length === 0) throw new BadRequestException('The file has no student rows.');
    if (records.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `Too many rows (max ${MAX_IMPORT_ROWS}). Split the file and import it in parts.`,
      );
    }

    const errors: ImportStudentsResult['errors'] = [];

    // 1. Validate every row with the same schema used for manual add.
    const valid: { row: number; data: CreateStudentInput }[] = [];
    records.forEach((record, index) => {
      const row = index + 2; // +1 for the header line, +1 because lines start at 1
      const parsed = createStudentSchema.safeParse(record);
      if (parsed.success) {
        valid.push({ row, data: parsed.data });
      } else {
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
    const seen = new Set<string>();
    const toInsert: Prisma.StudentCreateManyInput[] = [];
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
  private toHttpError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        'A student with this roll number already exists in that class and section.',
      );
    }
    return error;
  }
}
