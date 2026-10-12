import type { AuthSession, AuthUser } from '@quiz-nest/shared';
import { createContext, use } from 'react';

export type AuthState =
  | { status: 'loading'; user?: undefined }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'anonymous'; user?: undefined };

export type AuthContextValue = AuthState & {
  /** Call with the response of login or register. */
  signIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** The logged-in teacher and the signIn/signOut actions. */
export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
