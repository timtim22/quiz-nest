/**
 * Every error the API returns has one of these codes, so the web app can react
 * to a specific situation (e.g. EXAM_EXPIRED) instead of parsing messages.
 */
export const ErrorCode = {
  // General
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Set by the web app when a request never reached the server.
  CONNECTION_UNAVAILABLE: 'CONNECTION_UNAVAILABLE',

  // Exams
  INVALID_EXAM_CODE: 'INVALID_EXAM_CODE',
  EXAM_NOT_STARTED: 'EXAM_NOT_STARTED',
  EXAM_EXPIRED: 'EXAM_EXPIRED',
  EXAM_ALREADY_SUBMITTED: 'EXAM_ALREADY_SUBMITTED',
  DUPLICATE_ATTEMPT: 'DUPLICATE_ATTEMPT',
  ANSWER_SYNC_CONFLICT: 'ANSWER_SYNC_CONFLICT',

  // Files
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
