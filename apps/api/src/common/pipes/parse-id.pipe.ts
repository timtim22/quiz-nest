import { HttpStatus, Injectable, type PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@quiz-nest/shared';
import { AppException } from '../errors/app.exception.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks that an id in the URL looks like one of our ids (UUIDs). Anything else
 * can't exist, so it's a 404, not a database error:
 *
 *   @Get(':id') get(@Param('id', ParseIdPipe) id: string) { ... }
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID.test(value)) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Not found.', HttpStatus.NOT_FOUND);
    }
    return value.toLowerCase();
  }
}
