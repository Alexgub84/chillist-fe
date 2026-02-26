import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { routeTree } from '../../../src/routeTree.gen';
import { supabase } from '../../../src/lib/supabase';

vi.mock('../../../src/hooks/usePlan', () => ({
  usePlan: () => ({
    data: undefined,
    isLoading: false,
    error: new Error('Plan fetch failed'),
  }),
}));

vi.mocked(supabase.auth.getSession).mockResolvedValue({
  data: {
    session: {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user',
        email: 'test@test.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '',
      },
    },
  },
  error: null,
} as ReturnType<typeof supabase.auth.getSession> extends Promise<infer R>
  ? R
  : never);

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
