import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

const dotEnv = existsSync('.env') ? parse(readFileSync('.env')) : {};

/**
 * e2e tests use their own database and empty it between tests, so they never touch
 * your development data. Set TEST_DATABASE_URL in apps/api/.env (or the environment).
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  dotEnv.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/quiz_nest_test?schema=public';

if (!new URL(TEST_DATABASE_URL).pathname.includes('test')) {
  throw new Error(
    `TEST_DATABASE_URL must point to a database with "test" in its name, because the e2e ` +
      `tests delete all its data. Got: ${TEST_DATABASE_URL}`,
  );
}

export const TEST_ENV = {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_ACCESS_SECRET: 'e2e-test-secret-that-is-at-least-32-characters',
  WEB_URL: 'http://localhost:5173',
};
