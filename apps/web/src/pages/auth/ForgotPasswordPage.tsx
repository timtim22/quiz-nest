import { forgotPasswordSchema } from '@quiz-nest/shared';
import { AuthPageLayout } from '@/components/layout/AuthPageLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextLink } from '@/components/ui/TextLink';
import { forgotPassword } from '@/features/auth/api';
import { useSchemaForm } from '@/lib/use-schema-form';

export function ForgotPasswordPage() {
  const form = useSchemaForm(forgotPasswordSchema, forgotPassword);

  return (
    <AuthPageLayout
      title="Reset your password"
      description="Enter your email and we’ll send you a link to choose a new password."
      footer={<TextLink to="/login">Back to login</TextLink>}
    >
      {form.isSuccess ? (
        <div className="space-y-3">
          {/* Same message whether or not the account exists, like the API. */}
          <Alert variant="success">
            If an account exists for that email, a reset link is on its way. The link works for one
            hour.
          </Alert>
          {import.meta.env.DEV && (
            <Alert>
              Email isn’t set up yet. The link is printed in the terminal running the API.
            </Alert>
          )}
        </div>
      ) : (
        <>
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
            <Button type="submit" className="w-full" disabled={form.isSubmitting}>
              {form.isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}
    </AuthPageLayout>
  );
}
