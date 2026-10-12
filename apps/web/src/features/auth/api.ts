import type {
  AuthSession,
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@quiz-nest/shared';
import { apiClient } from '@/lib/api-client';

// A 401 from these means "wrong password" or "logged out", not "token expired",
// so they never trigger the automatic refresh-and-retry.
const noRetry = { retryOnUnauthorized: false };

export const register = (input: RegisterInput) =>
  apiClient.post<AuthSession>('/auth/register', input, noRetry);

export const login = (input: LoginInput) =>
  apiClient.post<AuthSession>('/auth/login', input, noRetry);

/** Uses the httpOnly refresh cookie, which the browser sends automatically. Null = logged out. */
export const refresh = () =>
  apiClient.post<AuthSession | null>('/auth/refresh', undefined, noRetry);

export const logout = () => apiClient.post<null>('/auth/logout', undefined, noRetry);

export const forgotPassword = (input: ForgotPasswordInput) =>
  apiClient.post<null>('/auth/forgot-password', input, noRetry);

export const resetPassword = (input: ResetPasswordInput) =>
  apiClient.post<null>('/auth/reset-password', input, noRetry);

export const getMe = () => apiClient.get<AuthUser>('/auth/me');
