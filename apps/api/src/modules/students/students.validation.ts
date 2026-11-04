import { BadRequestException } from '@nestjs/common';
import type { z } from 'zod';

/** Validates data with a Zod schema and throws a 400 listing every problem. */
export function parseWith<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    });
  }
  return result.data;
}
