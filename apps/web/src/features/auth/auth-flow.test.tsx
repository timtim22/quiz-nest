import type { AuthSession } from '@quiz-nest/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { setAccessToken } from '@/lib/api-client';
import { AuthProvider } from './AuthProvider';

const session: AuthSession = {
  accessToken: 'access-token',
  user: {
    id: 'u1',
    name: 'Ayesha Khan',
    email: 'ayesha@cityschool.pk',
    role: 'TEACHER',
    organizationId: 'o1',
    organizationName: 'City School',
  },
};

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
  });
const fail = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Fake API: answers by URL. Anything not listed gets a 401. */
function mockApi(handlers: Record<string, () => Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const path = url.replace(/^\/api/, '').split('?')[0];
      const handler = handlers[path];
      return Promise.resolve(handler ? handler() : fail(401, 'UNAUTHORIZED', 'Please log in.'));
    }),
  );
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

describe('login flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('sends logged-out visitors from teacher pages to login', async () => {
    mockApi({ '/auth/refresh': () => ok(null) });
    const router = renderAt('/teacher/dashboard');

    expect(await screen.findByRole('heading', { name: 'Teacher login' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?next=%2Fteacher%2Fdashboard');
  });

  it('keeps a teacher logged in after a page reload', async () => {
    mockApi({ '/auth/refresh': () => ok(session), '/health': () => ok(null) });
    renderAt('/teacher/dashboard');

    expect(await screen.findByText(/Welcome back, Ayesha/)).toBeInTheDocument();
  });

  it('checks the form before calling the API', async () => {
    mockApi({});
    renderAt('/login');

    fireEvent.click(await screen.findByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
  });

  it('shows the error for a wrong password', async () => {
    mockApi({
      '/auth/login': () => fail(401, 'INVALID_CREDENTIALS', 'Wrong email or password.'),
    });
    renderAt('/login');

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'ayesha@cityschool.pk' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.');
  });

  it('logs in and goes to the page the teacher asked for', async () => {
    mockApi({ '/auth/login': () => ok(session), '/health': () => ok(null) });
    const router = renderAt('/login?next=%2Fteacher%2Fdashboard');

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'ayesha@cityschool.pk' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText(/Welcome back, Ayesha/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/teacher/dashboard');
  });
});
