import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreatePlan } from '../../../src/routes/create-plan';
import { PlansList } from '../../../src/components/PlansList';

vi.mock('../../../src/contexts/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'test-token' },
    user: { id: 'user-1', email: 'test@chillist.dev' },
    loading: false,
    isAdmin: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('../../../src/hooks/usePlans', () => ({
  default: vi.fn(() => ({
    data: [
      {
        planId: 'plan-1',
        title: 'Summer Picnic',
        status: 'active',
        ownerParticipantId: 'user-1',
        createdAt: '2025-12-01T00:00:00Z',
        updatedAt: '2025-12-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  })),
}));

describe('CreatePlan - Navigation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should navigate from plans list to create-plan page when user clicks Create New Plan', async () => {
    const user = userEvent.setup();

    // Create router with real components
    const rootRoute = createRootRoute();

    const plansRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/plans',
      component: () => {
        // Use real PlansList component
        const plans = [
          {
            planId: 'plan-1',
            title: 'Summer Picnic',
            status: 'active' as const,
            ownerParticipantId: 'user-1',
            createdAt: '2025-12-01T00:00:00Z',
            updatedAt: '2025-12-01T00:00:00Z',
          },
        ];
        return <PlansList plans={plans} />;
      },
    });

    const createPlanRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/create-plan',
      component: CreatePlan,
    });

    const routeTree = rootRoute.addChildren([plansRoute, createPlanRoute]);

    const router = createRouter({
      routeTree,
      defaultPreload: 'intent',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    // Start at plans page
    router.navigate({ to: '/plans' });

    await waitFor(() => {
      expect(screen.getByText(/my plans/i)).toBeInTheDocument();
      expect(screen.getByText('Summer Picnic')).toBeInTheDocument();
    });

    // Click the "Create New Plan" link
    const createLink = screen.getByText(/create new plan/i);
    await user.click(createLink);

    // Verify navigation to create-plan page
    await waitFor(() => {
      expect(screen.getByText(/first name/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create plan/i })
      ).toBeInTheDocument();
    });
  });

  it('should display create plan form when navigating directly to /create-plan', async () => {
    const rootRoute = createRootRoute();

    const createPlanRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/create-plan',
      component: CreatePlan,
    });

    const routeTree = rootRoute.addChildren([createPlanRoute]);

    const router = createRouter({
      routeTree,
      defaultPreload: 'intent',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    router.navigate({ to: '/create-plan' });

    await waitFor(() => {
      expect(screen.getByText(/first name/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create plan/i })
      ).toBeInTheDocument();
    });
  });
});
