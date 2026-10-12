import type { AuthSession } from '@quiz-nest/shared';
import { ApiError, setAccessToken } from '@/lib/api-client';
import { refresh } from './api';

let inFlight: Promise<AuthSession | null> | null = null;

/**
 * Gets a fresh access token using the refresh cookie. Returns null when the user
 * isn't logged in. Calls made while one is already running share it, so the cookie
 * is only swapped once (React StrictMode and parallel requests both do this).
 */
export function restoreSession(): Promise<AuthSession | null> {
  inFlight ??= refresh()
    .then((session) => {
      setAccessToken(session?.accessToken ?? null);
      return session;
    })
    .catch((error: unknown) => {
      setAccessToken(null);
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Only allow redirects within this app, e.g. `/teacher/exams`, never `//evil.com`. */
export function safeNextPath(next: string | null, fallback = '/teacher/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback;
  }
  return next;
}
