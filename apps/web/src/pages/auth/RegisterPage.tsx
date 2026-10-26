import { PASSWORD_MIN_LENGTH, type RegisterResult, registerSchema } from '@quiz-nest/shared';
import { useState } from 'react';
import { AuthPageLayout } from '@/components/layout/AuthPageLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextLink } from '@/components/ui/TextLink';
import { register } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-context';
import { useSchemaForm } from '@/lib/use-schema-form';

export function RegisterPage() {
  const { signIn } = useAuth();
  const [pendingEmail, setPendingEmail] = useState<string>();
  const form = useSchemaForm(registerSchema, register, {
    onSuccess: (result: RegisterResult) => {
      // When admins must approve new teachers, there's no session yet.
      if ('pendingApproval' in result) setPendingEmail(result.email);
      else signIn(result);
    },
  });

  if (pendingEmail) {
    return (
      <AuthPageLayout title="Thanks for signing up">
        <Alert variant="success">
          Your account ({pendingEmail}) is waiting for approval by an administrator. You can log in
          once it’s approved.
        </Alert>
        <p className="mt-4 text-sm">
          <TextLink to="/login">Back to login</TextLink>
        </p>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Create a teacher account"
      description="Set up your question bank and exams in a few minutes."
      footer={
        <>
          Already have an account? <TextLink to="/login">Log in</TextLink>
        </>
      }
    >
      {form.formError && (
        <Alert variant="error" className="mb-4">
          {form.formError}
        </Alert>
      )}

      <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
        <TextField
          label="Your name"
          name="name"
          autoComplete="name"
          error={form.fieldErrors.name}
          required
        />
        <TextField
          label="School or academy"
          name="schoolName"
          autoComplete="organization"
          error={form.fieldErrors.schoolName}
          required
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={form.fieldErrors.email}
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`}
          error={form.fieldErrors.password}
          required
        />
        <Button type="submit" className="w-full" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
