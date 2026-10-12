const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Login (access) tokens are short-lived; the web app silently refreshes them. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** How long a teacher stays logged in without using the app. */
export const REFRESH_TOKEN_TTL_MS = 30 * DAY;

/**
 * After a refresh token is swapped for a new one, the old one still works for this long.
 * Two tabs refreshing at the same moment would otherwise log each other out.
 */
export const ROTATION_GRACE_MS = 30_000;

export const PASSWORD_RESET_TTL_MS = 60 * MINUTE;

/** httpOnly cookie that holds the refresh token. JavaScript in the page can't read it. */
export const REFRESH_COOKIE = 'qn_refresh';
