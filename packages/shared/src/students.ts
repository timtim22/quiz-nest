import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rollNumber = z.string().trim().min(1, 'Roll number is required').max(30);
const name = z.string().trim().min(1, 'Name is required').max(120);
const className = z.string().trim().min(1, 'Class is required').max(30);
// Stored uppercase so "a" and "A" are the same section. Empty = no section.
const section = z.string().trim().toUpperCase().max(10);
// Optional. Empty string or null both mean "no parent email".
const parentEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => v === '' || EMAIL_PATTERN.test(v), 'Enter a valid email address')
  .nullish();

export const createStudentSchema = z.object({
  rollNumber,
  name,
  className,
  section: section.optional(),
  parentEmail,
});

export const updateStudentSchema = createStudentSchema.partial();

export const listStudentsQuerySchema = z.object({
  q: z.string().trim().optional(),
  className: z.string().trim().optional(),
  section: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;

/** A student as the API returns it (dates arrive as ISO strings). */
export interface StudentDto {
  id: string;
  rollNumber: string;
  name: string;
  className: string;
  section: string;
  parentEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportStudentsResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
