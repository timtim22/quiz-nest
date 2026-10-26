import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAccessToken } from '@/lib/api-client';
import { renderApp } from '@/test/render-app';

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Bilal Ahmed' } });
  fireEvent.change(screen.getByLabelText('School or academy'), {
    target: { value: 'Model School' },
  });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bilal@school.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('tells the teacher to wait when admins must approve new accounts', async () => {
    renderApp('/register', ({ path }) => {
      if (path === '/auth/refresh') return { data: null };
      if (path === '/auth/register') {
        return { status: 202, data: { pendingApproval: true, email: 'bilal@school.test' } };
      }
      return undefined;
    });

    await screen.findByRole('heading', { name: 'Create a teacher account' });
    fillAndSubmit();

    expect(
      await screen.findByText(/is waiting for approval by an administrator/),
    ).toBeInTheDocument();
    expect(screen.getByText(/bilal@school.test/)).toBeInTheDocument();
  });
});
