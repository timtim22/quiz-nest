import type { AdminUserDto } from '@quiz-nest/shared';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAccessToken } from '@/lib/api-client';
import { renderApp, sessionFor } from '@/test/render-app';

const pendingTeacher: AdminUserDto = {
  id: '0199a000-0000-7000-8000-000000000001',
  name: 'Bilal Ahmed',
  email: 'bilal@school.test',
  role: 'TEACHER',
  status: 'PENDING',
  organizationName: 'Model School',
  createdAt: new Date().toISOString(),
};

describe('Admin users page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('shows teachers a "no access" page', async () => {
    renderApp('/admin/users', ({ path }) =>
      path === '/auth/refresh' ? { data: sessionFor('TEACHER') } : undefined,
    );

    expect(await screen.findByText('You don’t have access to this page')).toBeInTheDocument();
  });

  it('lets an admin approve a waiting teacher', async () => {
    let teacher = pendingTeacher;
    const { fetchMock } = renderApp('/admin/users', ({ method, path }) => {
      if (path === '/auth/refresh') return { data: sessionFor('ADMIN') };
      if (method === 'GET' && path === '/admin/users') {
        return { data: { items: [teacher], page: 1, pageSize: 20, total: 1 } };
      }
      if (method === 'POST' && path === `/admin/users/${teacher.id}/approve`) {
        teacher = { ...teacher, status: 'ACTIVE' };
        return { data: teacher };
      }
      return undefined;
    });

    const row = (await screen.findByText('Bilal Ahmed')).closest('li')!;
    expect(within(row).getByText('Waiting for approval')).toBeInTheDocument();

    fireEvent.click(within(row).getByRole('button', { name: 'Approve' }));

    expect(await within(row).findByText('Active')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/users/${teacher.id}/approve`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not offer actions on your own account', async () => {
    const me = {
      ...pendingTeacher,
      id: 'me',
      name: 'Admin Person',
      email: 'me@school.test',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
    };
    renderApp('/admin/users', ({ method, path }) => {
      if (path === '/auth/refresh') return { data: sessionFor('ADMIN', 'me') };
      if (method === 'GET' && path === '/admin/users') {
        return { data: { items: [me], page: 1, pageSize: 20, total: 1 } };
      }
      return undefined;
    });

    const row = (await screen.findByText('me@school.test')).closest('li')!;
    expect(within(row).getByText('You')).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });
});
