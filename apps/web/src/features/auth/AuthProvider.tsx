import type { AuthSession } from '@quiz-nest/shared';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { setAccessToken, setAccessTokenRefresher } from '@/lib/api-client';
import { logout } from './api';
import { type AuthContextValue, AuthContext, type AuthState } from './auth-context';
import { restoreSession } from './session';

/** Knows who is logged in. Wraps the whole app (see App.tsx). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const apply = (session: AuthSession | null) => {
      if (!active) return;
      setState(session ? { status: 'authenticated', user: session.user } : { status: 'anonymous' });
    };

    // Access tokens last 15 minutes. When one expires, the API client calls this and retries.
    setAccessTokenRefresher(async () => {
      const session = await restoreSession().catch(() => null);
      apply(session);
      return session?.accessToken ?? null;
    });

    // On page load, the refresh cookie tells us whether the teacher is still logged in.
    restoreSession().then(apply, () => apply(null));

    return () => {
      active = false;
      setAccessTokenRefresher(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn(session) {
        setAccessToken(session.accessToken);
        setState({ status: 'authenticated', user: session.user });
      },
      async signOut() {
        try {
          await logout();
        } finally {
          setAccessToken(null);
          queryClient.clear();
          setState({ status: 'anonymous' });
        }
      },
    }),
    [state, queryClient],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
