import type { UserRole } from '@quiz-nest/shared';
import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from './auth-context';
import { safeNextPath } from './session';

/** Wrap pages that need a logged-in teacher. Others are sent to /login and come back after. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') return <PageLoader />;
  if (auth.status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

/** Wrap login/register pages: a logged-in teacher goes straight to where they were heading. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [searchParams] = useSearchParams();

  if (auth.status === 'loading') return <PageLoader />;
  if (auth.status === 'authenticated') {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;
  }
  return children;
}

/**
 * Use inside RequireAuth for pages only some roles may see. The API checks roles
 * too; this just shows a friendly page instead of errors.
 */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === role) return children;

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShieldAlert className="size-10 text-gold-500" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        You don’t have access to this page
      </h1>
      <p className="mt-2 text-sm text-slate-600">It’s only available to administrators.</p>
      <ButtonLink to="/teacher/dashboard" variant="secondary" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
