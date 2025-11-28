import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { routeTree } from '../../../routeTree.gen';

// Mock the usePlan hook used by the /plan/$planId route to return an error
vi.mock('../../../hooks/usePlan', () => ({
  usePlan: () => ({
    data: undefined,
    isLoading: false,
    error: new Error('Plan fetch failed'),
  }),
}));

describe('Router integration - Error via plan route', () => {
  it('renders ErrorPage when the plan loader/hook errors', async () => {
    // Visit a plan that will trigger the mocked error
    window.history.pushState({}, '', '/plan/plan-does-not-exist');

    const router = createRouter({ routeTree });
    const qc = new QueryClient();

    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    expect(
      await screen.findByText(/Something went wrong/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Plan fetch failed/i)).toBeInTheDocument();
  });
});
