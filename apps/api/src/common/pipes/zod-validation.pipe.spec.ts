import { ErrorCode, paginationQuerySchema } from '@quiz-nest/shared';
import { AppException } from '../errors/app.exception.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(paginationQuerySchema);

  it('returns the parsed value', () => {
    expect(pipe.transform({ page: '2' })).toEqual({ page: 2, pageSize: 20 });
  });

  it('throws VALIDATION_ERROR listing each invalid field', () => {
    const error = (() => {
      try {
        pipe.transform({ page: '0' });
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).code).toBe(ErrorCode.VALIDATION_ERROR);
    expect((error as AppException).details).toEqual([
      { path: 'page', message: expect.any(String) },
    ]);
  });
});
