// Constants use `as const` objects instead of TypeScript enums so they work the
// same in the API, the web app and plain JavaScript.

export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
