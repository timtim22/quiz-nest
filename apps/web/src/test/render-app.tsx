import type { AuthSession, UserRole } from '@quiz-nest/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { routes } from '@/app/router';
import { AuthProvider } from '@/features/auth/AuthProvider';

export interface FakeRequest {
  method: string;
  /** Without the /api prefix or the query string, e.g. "/admin/users". */
  path: string;
  query: URLSearchParams;
  body: unknown;
}

/** Return the `data` for a success, `{ status, error }` for a failure, or undefined for 404. */
export type FakeHandler = (
  request: FakeRequest,
) =>
  | { data: unknown; status?: number }
  | { error: { code: string; message: string }; status: number }
  | undefined;

/** A logged-in session for tests. */
export function sessionFor(role: UserRole, id = 'me'): AuthSession {
  return {
    accessToken: 'token',
    user: {
      id,
      name: role === 'ADMIN' ? 'Admin Person' : 'Ayesha Khan',
      email: `${id}@school.test`,
      role,
      organizationId: 'o1',
      organizationName: 'City School',
    },
  };
}

/**
 * Renders the whole app at `path`, with fetch answered by `handler`.
 * Returns the fetch mock so tests can check which requests were made.
 */
export function renderApp(path: string, handler: FakeHandler) {
  const fetchMock = vi.fn((url: string, init: RequestInit) => {
    const [path, search = ''] = url.replace(/^\/api/, '').split('?');
    const request: FakeRequest = {
      method: init.method ?? 'GET',
      path,
      query: new URLSearchParams(search),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    const result = handler(request) ?? {
      status: 404,
      error: { code: 'NOT_FOUND', message: 'Not found.' },
    };
    const body =
      'error' in result
        ? { success: false, error: result.error }
        : { success: true, data: result.data };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: result.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { fetchMock, router };
}
