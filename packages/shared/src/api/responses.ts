import type { ErrorCode } from './errors.js';

/** Shape of every successful API response. */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  /** Extra context, e.g. the list of invalid fields for VALIDATION_ERROR. */
  details?: unknown;
}

/** Shape of every failed API response. */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** One entry in `details` for a VALIDATION_ERROR. */
export interface ValidationIssue {
  path: string;
  message: string;
}

/** GET /api/health */
export interface HealthStatus {
  status: 'ok';
  database: 'up';
  uptimeSeconds: number;
  timestamp: string;
}
