import type { AuthSession, SubjectSummaryDto } from '@quiz-nest/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { setAccessToken } from '@/lib/api-client';

const session: AuthSession = {
  accessToken: 'token',
  user: {
    id: 'u1',
    name: 'Ayesha Khan',
    email: 'ayesha@cityschool.pk',
    role: 'TEACHER',
    organizationId: 'o1',
    organizationName: 'City School',
  },
};

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );

/** A tiny fake API that remembers subjects, so the page can add and re-list them. */
function fakeApi(initial: string[]) {
  const subjects: SubjectSummaryDto[] = initial.map((name, i) => ({
    id: `s${i}`,
    name,
    description: null,
    chapterCount: 0,
    createdAt: new Date().toISOString(),
  }));

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init: RequestInit) => {
      const path = url.replace(/^\/api/, '');
      if (path === '/auth/refresh') return json(200, { success: true, data: session });
      if (path === '/subjects' && init.method === 'GET') {
        return json(200, { success: true, data: subjects });
      }
      if (path === '/subjects' && init.method === 'POST') {
        const { name } = JSON.parse(String(init.body)) as { name: string };
        if (subjects.some((s) => s.name === name)) {
          return json(409, {
            success: false,
            error: { code: 'CONFLICT', message: 'You already have a subject with this name.' },
          });
        }
        const created = { ...subjects[0], id: `s${subjects.length}`, name, chapterCount: 0 };
        subjects.push(created);
        return json(201, { success: true, data: created });
      }
      return json(404, { success: false, error: { code: 'NOT_FOUND', message: 'Not found.' } });
    }),
  );
}

function renderSubjectsPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: ['/teacher/subjects'] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

async function addSubject(name: string) {
  fireEvent.change(await screen.findByLabelText('New subject name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
}

describe('SubjectsPage', () => {
  beforeEach(() => {
    fakeApi(['Physics']);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('lists subjects and adds a new one', async () => {
    renderSubjectsPage();

    expect(await screen.findByText('Physics')).toBeInTheDocument();
    await addSubject('Chemistry');

    expect(await screen.findByText('Chemistry')).toBeInTheDocument();
    expect(screen.getByLabelText('New subject name')).toHaveValue('');
  });

  it('shows the error for a duplicate name and keeps the text', async () => {
    renderSubjectsPage();

    await screen.findByText('Physics');
    await addSubject('Physics');

    expect(
      await screen.findByText('You already have a subject with this name.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('New subject name')).toHaveValue('Physics');
  });
});
