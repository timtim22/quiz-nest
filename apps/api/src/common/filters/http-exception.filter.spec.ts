import { HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@quiz-nest/shared';
import { AppException } from '../errors/app.exception.js';
import { toErrorResult } from './http-exception.filter.js';

describe('toErrorResult', () => {
  it('keeps the code, message and details of an AppException', () => {
    const result = toErrorResult(
      new AppException(ErrorCode.EXAM_EXPIRED, 'This exam has ended.', HttpStatus.GONE, {
        endedAt: 'x',
      }),
    );

    expect(result).toEqual({
      status: HttpStatus.GONE,
      body: {
        success: false,
        error: {
          code: ErrorCode.EXAM_EXPIRED,
          message: 'This exam has ended.',
          details: { endedAt: 'x' },
        },
      },
    });
  });

  it('maps built-in Nest exceptions to a code by status', () => {
    const result = toErrorResult(new NotFoundException('Cannot GET /api/nope'));

    expect(result.status).toBe(404);
    expect(result.body.error).toEqual({
      code: ErrorCode.NOT_FOUND,
      message: 'Cannot GET /api/nope',
    });
  });

  it('joins array messages from built-in exceptions', () => {
    const result = toErrorResult(new BadRequestException(['a is required', 'b is required']));

    expect(result.body.error.message).toBe('a is required, b is required');
  });

  it('maps Express middleware errors that carry a status', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), { status: 413 });

    expect(toErrorResult(tooLarge).body.error.code).toBe(ErrorCode.PAYLOAD_TOO_LARGE);
  });

  it('hides the details of unexpected errors', () => {
    const result = toErrorResult(new Error('db password is hunter2'));

    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(result.body.error.message).not.toContain('hunter2');
  });
});
