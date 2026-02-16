import { render, screen } from '@testing-library/react';
import { it, describe, expect } from 'vitest';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { routeTree } from '../../../src/routeTree.gen';

describe('Router integration - NotFound', () => {
  it('renders NotFound UI when navigating to an unknown path', async () => {
    // Simulate a user visiting /nope
    window.history.pushState({}, '', '/nope');

    const router = createRouter({ routeTree });
    const qc = new QueryClient();

    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    expect(
      await screen.findByText(/404 — Page Not Found/i)
    ).toBeInTheDocument();
  });
});
