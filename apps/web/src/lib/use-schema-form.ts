import { ErrorCode, type ValidationIssue } from '@quiz-nest/shared';
import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import type { z } from 'zod';
import { ApiError } from './api-client';

export type FieldErrors = Partial<Record<string, string>>;

interface Options<TResult> {
  onSuccess?: (result: TResult) => void | Promise<void>;
}

/**
 * Runs a form through a Zod schema from @quiz-nest/shared, then submits it.
 * Give every input a `name` that matches the schema, then:
 *
 *   const form = useSchemaForm(loginSchema, login, { onSuccess: signIn });
 *   <form onSubmit={form.handleSubmit} noValidate>
 *     <TextField name="email" error={form.fieldErrors.email} />
 *
 * Field errors come from the schema first, then from the API's VALIDATION_ERROR.
 * Any other API error is in `formError`.
 */
export function useSchemaForm<TSchema extends z.ZodType, TResult>(
  schema: TSchema,
  submit: (values: z.output<TSchema>) => Promise<TResult>,
  options: Options<TResult> = {},
) {
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const mutation = useMutation({ mutationFn: submit, onSuccess: options.onSuccess });

  const serverIssues = validationIssues(mutation.error);
  const fieldErrors: FieldErrors = { ...toFieldErrors(serverIssues ?? []), ...clientErrors };
  const formError = mutation.error && !serverIssues ? messageOf(mutation.error) : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      setClientErrors(
        toFieldErrors(
          result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    setClientErrors({});
    mutation.mutate(result.data);
  }

  return {
    handleSubmit,
    fieldErrors,
    formError,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}

function validationIssues(error: unknown): ValidationIssue[] | undefined {
  if (error instanceof ApiError && error.code === ErrorCode.VALIDATION_ERROR) {
    return Array.isArray(error.details) ? (error.details as ValidationIssue[]) : [];
  }
  return undefined;
}

/** Keeps the first message for each field. */
function toFieldErrors(issues: ValidationIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { path, message } of issues) errors[path] ??= message;
  return errors;
}

function messageOf(error: Error): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
