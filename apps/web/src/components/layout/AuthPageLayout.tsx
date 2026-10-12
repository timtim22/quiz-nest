import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';

interface AuthPageLayoutProps {
  title: string;
  description?: string;
  /** Shown under the card, e.g. "Already have an account? Log in". */
  footer?: ReactNode;
  children: ReactNode;
}

/** Centered card used by login, sign-up and password reset pages. */
export function AuthPageLayout({ title, description, footer, children }: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>

      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        <div className="mt-6">{children}</div>
      </Card>

      {footer && <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>}
    </div>
  );
}
