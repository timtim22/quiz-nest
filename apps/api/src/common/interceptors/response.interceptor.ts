import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { ApiSuccessResponse } from '@quiz-nest/shared';
import { map, type Observable } from 'rxjs';

/**
 * Wraps whatever a controller returns in { success: true, data }.
 * Controllers just return the data. File downloads (StreamableFile) are left untouched.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T> | T> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) return data;
        return { success: true as const, data: (data ?? null) as T };
      }),
    );
  }
}
