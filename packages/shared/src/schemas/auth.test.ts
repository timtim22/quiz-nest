import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetPasswordSchema, utf8ByteLength } from './auth.js';

describe('utf8ByteLength', () => {
  it('counts bytes the way UTF-8 stores them', () => {
    expect(utf8ByteLength('abc')).toBe(3);
    expect(utf8ByteLength('ا')).toBe(2);
    expect(utf8ByteLength('€')).toBe(3);
    expect(utf8ByteLength('😀')).toBe(4);
  });
});

const validRegistration = {
  name: 'Ayesha Khan',
  email: 'ayesha@school.pk',
  password: 'secret123',
  schoolName: 'City School',
};

describe('registerSchema', () => {
  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('trims and lowercases the email', () => {
    const result = registerSchema.parse({ ...validRegistration, email: '  Ayesha@School.PK ' });
    expect(result.email).toBe('ayesha@school.pk');
  });

  it('rejects short passwords and passwords without a number', () => {
    expect(registerSchema.safeParse({ ...validRegistration, password: 'abc12' }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ ...validRegistration, password: 'abcdefgh' }).success).toBe(
      false,
    );
  });

  it('accepts Urdu letters in a password', () => {
    expect(
      registerSchema.safeParse({ ...validRegistration, password: 'پاکستان2026' }).success,
    ).toBe(true);
  });

  it('rejects passwords longer than 72 bytes, even when under 72 characters', () => {
    // 40 Urdu letters are 80 bytes.
    const password = `${'ا'.repeat(40)}1`;
    expect(password.length).toBeLessThan(72);
    expect(registerSchema.safeParse({ ...validRegistration, password }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('does not apply new-password rules, so older passwords still work', () => {
    expect(loginSchema.safeParse({ email: 'a@b.pk', password: 'x' }).success).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.pk', password: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('needs a token and a valid new password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'newpass99' }).success).toBe(
      true,
    );
    expect(resetPasswordSchema.safeParse({ token: '', password: 'newpass99' }).success).toBe(false);
  });
});
