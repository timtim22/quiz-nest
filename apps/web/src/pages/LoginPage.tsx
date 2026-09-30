import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { TextField } from '@/components/ui/TextField';

// TODO(QN-2): submit to POST /api/auth/login and redirect to the dashboard.
export function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>

      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">Teacher login</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to manage your questions and exams.</p>

        <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()} noValidate>
          <TextField label="Email" name="email" type="email" autoComplete="email" required />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit" className="w-full" disabled>
            Log in
          </Button>
        </form>
      </Card>

      {import.meta.env.DEV && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Login isn’t built yet.{' '}
          <Link to="/teacher/dashboard" className="font-medium text-brand-700 underline">
            Open the dashboard
          </Link>
        </p>
      )}
    </div>
  );
}
