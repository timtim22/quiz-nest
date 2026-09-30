import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry network/server problems once, but not "you're not allowed" or "not found".
      retry: (failureCount, error) =>
        failureCount < 1 &&
        !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});
