// Constants use `as const` objects instead of TypeScript enums so they work the
// same in the API, the web app and plain JavaScript.

export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  /** Signed up while "new teachers need approval" was on; can't log in yet. */
  PENDING: 'PENDING',
  DISABLED: 'DISABLED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
