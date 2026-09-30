import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type ApiErrorResponse, ErrorCode } from '@quiz-nest/shared';
import type { Response } from 'express';
import { AppException } from '../errors/app.exception.js';

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

interface ErrorResult {
  status: number;
  body: ApiErrorResponse;
}

/** Converts any thrown error into the standard API error response. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const { status, body } = toErrorResult(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : exception,
      );
    }

    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}

export function toErrorResult(exception: unknown): ErrorResult {
  if (exception instanceof AppException) {
    return errorResult(exception.getStatus(), exception.code, exception.message, exception.details);
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return errorResult(status, codeForStatus(status), messageOf(exception));
  }

  // Errors from Express middleware (e.g. body-parser) carry a status but aren't HttpExceptions.
  const middlewareStatus = statusOf(exception);
  if (middlewareStatus && middlewareStatus < HttpStatus.INTERNAL_SERVER_ERROR) {
    const message = exception instanceof Error ? exception.message : 'Bad request.';
    return errorResult(middlewareStatus, codeForStatus(middlewareStatus), message);
  }

  // Never leak internal details to the client; they're logged instead.
  return errorResult(
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_ERROR,
    'Something went wrong. Please try again.',
  );
}

function errorResult(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
): ErrorResult {
  return {
    status,
    body: {
      success: false,
      error: details === undefined ? { code, message } : { code, message, details },
    },
  };
}

function codeForStatus(status: number): ErrorCode {
  return (
    CODE_BY_STATUS[status] ??
    (status >= HttpStatus.INTERNAL_SERVER_ERROR ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST)
  );
}

/** Nest's built-in exceptions put the message in different places depending on how they were thrown. */
function messageOf(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;

  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return exception.message;
}

function statusOf(exception: unknown): number | undefined {
  if (typeof exception !== 'object' || exception === null) return undefined;
  const { status, statusCode } = exception as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === 'number' ? value : undefined;
}
