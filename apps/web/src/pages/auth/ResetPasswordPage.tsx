import { PASSWORD_MIN_LENGTH, resetPasswordSchema } from '@quiz-nest/shared';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { AuthPageLayout } from '@/components/layout/AuthPageLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextLink } from '@/components/ui/TextLink';
import { resetPassword } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-context';
import { useSchemaForm } from '@/lib/use-schema-form';

// The "type it twice" check only matters in the browser, so it lives here, not in shared.
const resetFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The two passwords don’t match.',
  });

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const token = searchParams.get('token');

  const form = useSchemaForm(
    resetFormSchema,
    ({ token, password }) => resetPassword({ token, password }),
    {
      // The API logs the user out everywhere, so make sure this browser agrees.
      onSuccess: async () => {
        await signOut();
        navigate('/login?reset=1', { replace: true });
      },
    },
  );

  if (!token) {
    return (
      <AuthPageLayout title="Reset your password">
        <Alert variant="error">
          This reset link is incomplete. Please{' '}
          <TextLink to="/forgot-password">request a new one</TextLink>.
        </Alert>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Choose a new password"
      footer={<TextLink to="/login">Back to login</TextLink>}
    >
      {form.formError && (
        <Alert variant="error" className="mb-4">
          {form.formError} <TextLink to="/forgot-password">Request a new link</TextLink>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
        <input type="hidden" name="token" value={token} />
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`}
          error={form.fieldErrors.password}
          required
        />
        <TextField
          label="Type it again"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={form.fieldErrors.confirmPassword}
          required
        />
        <Button type="submit" className="w-full" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
