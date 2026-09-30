import { type ApiResponse, ErrorCode } from '@quiz-nest/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Thrown for every failed request. Check `code` (an ErrorCode) to decide what to show. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** Sent as JSON. */
  body?: unknown;
  query?: QueryParams;
}

/**
 * The only place the web app talks to the API. Use it from feature `api.ts` files:
 *
 *   export const getSubjects = () => apiClient.get<Subject[]>('/subjects');
 *
 * It returns the `data` of { success: true, data } and throws ApiError otherwise.
 */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers: extraHeaders, ...init } = options;

  const headers = new Headers(extraHeaders);
  headers.set('Accept', 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
  } catch (error) {
    throw new ApiError(
      ErrorCode.CONNECTION_UNAVAILABLE,
      'Could not reach the server. Check your internet connection.',
      0,
      error,
    );
  }

  const payload = await readJson<ApiResponse<T>>(response);

  if (payload?.success === true && response.ok) return payload.data;
  if (payload?.success === false) {
    const { code, message, details } = payload.error;
    throw new ApiError(code, message, response.status, details);
  }
  throw new ApiError(
    response.status >= 500 ? ErrorCode.SERVICE_UNAVAILABLE : ErrorCode.BAD_REQUEST,
    `Unexpected response from the server (${response.status}).`,
    response.status,
  );
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}
