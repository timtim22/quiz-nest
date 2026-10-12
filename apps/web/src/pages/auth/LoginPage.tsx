import { loginSchema } from '@quiz-nest/shared';
import { useSearchParams } from 'react-router';
import { AuthPageLayout } from '@/components/layout/AuthPageLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextLink } from '@/components/ui/TextLink';
import { login } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-context';
import { useSchemaForm } from '@/lib/use-schema-form';

// After login, GuestOnly (see router.tsx) sends the teacher on to ?next= or the dashboard.
export function LoginPage() {
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const form = useSchemaForm(loginSchema, login, { onSuccess: signIn });

  return (
    <AuthPageLayout
      title="Teacher login"
      description="Log in to manage your questions and exams."
      footer={
        <>
          New to Quiz Nest? <TextLink to="/register">Create an account</TextLink>
        </>
      }
    >
      {searchParams.get('reset') === '1' && (
        <Alert variant="success" className="mb-4">
          Your password has been changed. Log in with your new password.
        </Alert>
      )}
      {form.formError && (
        <Alert variant="error" className="mb-4">
          {form.formError}
        </Alert>
      )}

      <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={form.fieldErrors.email}
          required
        />
        <div>
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            error={form.fieldErrors.password}
            required
          />
          <p className="mt-2 text-end text-sm">
            <TextLink to="/forgot-password">Forgot password?</TextLink>
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
