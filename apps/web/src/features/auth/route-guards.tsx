import type { ReactNode } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';
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
