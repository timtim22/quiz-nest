import { z } from 'zod';
import type { UserRole } from '../constants/roles.js';

/** bcrypt only looks at the first 72 bytes of a password. Urdu letters take 2+ bytes each. */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_MIN_LENGTH = 8;

/** Length of a string in UTF-8 bytes, which is what bcrypt counts. */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254, 'Email is too long.'));

/** Rules for a new password. Login uses a looser check so old passwords still work. */
const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES, {
    message: 'Password is too long.',
  })
  .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), {
    message: 'Use at least one letter and one number.',
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(100, 'Name is too long.'),
  email,
  password: newPassword,
  schoolName: z
    .string()
    .trim()
    .min(2, 'Enter your school or academy name.')
    .max(120, 'School name is too long.'),
});

export const loginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, 'Enter your password.')
    .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES, {
      message: 'Password is too long.',
    }),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'This reset link is invalid.').max(200),
  password: newPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** The logged-in user, as the web app sees them. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
}

/** Returned by register, login and refresh. The refresh token travels separately in a cookie. */
export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
