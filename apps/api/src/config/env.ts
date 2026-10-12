import { z } from 'zod';

/** Every environment variable the API reads. Add new ones here, and to .env.example. */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'must be a postgresql:// connection string'),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    /** Signs login (access) tokens. Long and random; different in every environment. */
    JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
    /** Where the web app lives. Used to build links in emails, e.g. password reset. */
    WEB_URL: z.url().default('http://localhost:5173'),
  })
  .refine(
    (env) => env.NODE_ENV !== 'production' || !env.JWT_ACCESS_SECRET.startsWith('replace-me'),
    {
      path: ['JWT_ACCESS_SECRET'],
      message: 'still has the example value from .env.example',
    },
  );

export type Env = z.infer<typeof envSchema>;

/** Used by ConfigModule: the API refuses to start with missing or invalid env vars. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
