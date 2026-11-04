import type { z } from 'zod';
/** Validates data with a Zod schema and throws a 400 listing every problem. */
export declare function parseWith<S extends z.ZodType>(schema: S, data: unknown): z.output<S>;
//# sourceMappingURL=students.validation.d.ts.map