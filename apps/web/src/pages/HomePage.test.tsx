import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

function renderHomePage() {
  const router = createMemoryRouter([{ path: '/', element: <HomePage /> }]);
  render(<RouterProvider router={router} />);
}

describe('HomePage', () => {
  it('sends students to the join page', () => {
    renderHomePage();

    expect(screen.getByRole('link', { name: /join an exam/i })).toHaveAttribute(
      'href',
      '/student/join',
    );
  });

  it('sends teachers to the login page', () => {
    renderHomePage();

    expect(screen.getByRole('link', { name: /teacher login/i })).toHaveAttribute('href', '/login');
  });
});
