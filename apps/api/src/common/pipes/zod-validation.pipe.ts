import { HttpStatus, type PipeTransform } from '@nestjs/common';
import { ErrorCode, type ValidationIssue } from '@quiz-nest/shared';
import type { z } from 'zod';
import { AppException } from '../errors/app.exception.js';

/**
 * Validates a request body/query/param with a Zod schema from @quiz-nest/shared,
 * so the API and the web forms use exactly the same rules:
 *
 *   @Get()
 *   list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) { ... }
 */
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new AppException(
      ErrorCode.VALIDATION_ERROR,
      'Some fields are invalid.',
      HttpStatus.BAD_REQUEST,
      issues,
    );
  }
}
