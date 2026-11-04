import { z } from 'zod';
/** Every environment variable the API reads. Add new ones here, and to .env.example. */
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    JWT_ACCESS_SECRET: z.ZodString;
    WEB_URL: z.ZodDefault<z.ZodURL>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
/** Used by ConfigModule: the API refuses to start with missing or invalid env vars. */
export declare function validateEnv(config: Record<string, unknown>): Env;
//# sourceMappingURL=env.d.ts.map