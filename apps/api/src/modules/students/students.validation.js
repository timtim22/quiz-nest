import { BadRequestException } from '@nestjs/common';
/** Validates data with a Zod schema and throws a 400 listing every problem. */
export function parseWith(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new BadRequestException({
            message: 'Validation failed',
            errors: result.error.issues.map((issue) => ({
                field: issue.path.map(String).join('.'),
                message: issue.message,
            })),
        });
    }
    return result.data;
}
//# sourceMappingURL=students.validation.js.map