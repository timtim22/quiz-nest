import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * A real bcrypt hash of a random string. Checking a password against it takes as long
 * as checking a real one, so login doesn't reveal which emails have accounts.
 */
const DUMMY_HASH = '$2b$12$QKXKL5etZsAZ.7iF/VZt2.3tufpNVwPxKCgx0WzcQj8F5Rnevb6xm';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Pass `undefined` as the hash when the user doesn't exist; it still takes the same time. */
export function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH).then((matches) => matches && !!hash);
}

/** A long random token for refresh cookies and reset links. */
export function createRandomToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Tokens are stored as SHA-256 hashes, so a leaked database can't be used to log in.
 * (SHA-256 is fine here: unlike passwords, these tokens are long and random.)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
