import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@quiz-nest/shared';

/**
 * Throw this from services and controllers for any expected failure:
 *
 *   throw new AppException(ErrorCode.EXAM_EXPIRED, 'This exam has ended.', HttpStatus.GONE);
 *
 * The global filter turns it into { success: false, error: { code, message, details } }.
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly details?: unknown,
  ) {
    super(message, status);
  }
}
