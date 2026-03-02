import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from '../../../src/routeTree.gen';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';
import type { JoinRequest } from '../../../src/core/schemas/join-request';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../src/hooks/usePlan', () => ({
  usePlan: vi.fn(),
}));

vi.mock('../../../src/contexts/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useCreateParticipant', () => ({
  useCreateParticipant: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../../../src/hooks/useUpdateParticipant', () => ({
  useUpdateParticipant: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hot-toast')>();
  return {
    ...actual,
    default: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: 'owner-user-id',
              email: 'owner@test.com',
              aud: 'authenticated',
              app_metadata: {},
              user_metadata: {},
              created_at: '',
            },
          },
        },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: 'google', url: '' },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      }),
      updateUser: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

function buildPlan(overrides?: Partial<PlanWithDetails>): PlanWithDetails {
  return {
    planId: 'plan-1',
    title: 'Test Plan',
    description: null,
    status: 'active',
    visibility: 'private',
    ownerParticipantId: 'p-1',
    startDate: '2026-07-10T09:00:00Z',
    endDate: '2026-07-12T18:00:00Z',
    tags: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    items: [],
    participants: [
      {
        participantId: 'p-1',
        planId: 'plan-1',
        userId: 'owner-user-id',
        name: 'Alice',
        lastName: 'Owner',
        contactPhone: '555-0001',
        displayName: null,
        role: 'owner',
        avatarUrl: null,
        contactEmail: null,
        inviteToken: null,
        rsvpStatus: 'confirmed',
        lastActivityAt: null,
        adultsCount: null,
        kidsCount: null,
        foodPreferences: null,
        allergies: null,
        notes: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    ...overrides,
  };
}

function buildJoinRequest(overrides?: Partial<JoinRequest>): JoinRequest {
  return {
    requestId: 'req-1',
    planId: 'plan-1',
    supabaseUserId: 'supa-1',
    name: 'Bob',
    lastName: 'Requester',
    contactPhone: '555-9999',
    contactEmail: null,
    displayName: null,
    adultsCount: 2,
    kidsCount: 1,
    foodPreferences: null,
    allergies: null,
    notes: null,
    status: 'pending',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Manage Participants route', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { usePlan } = await import('../../../src/hooks/usePlan');
    const { useAuth } = await import('../../../src/contexts/useAuth');

    vi.mocked(usePlan).mockReturnValue({
      data: buildPlan(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePlan>);

    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'token' },
      user: { id: 'owner-user-id', email: 'owner@test.com' },
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    } as ReturnType<typeof useAuth>);
  });

  it('renders manage participants page for owner', async () => {
    window.history.pushState({}, '', '/manage-participants/plan-1');

    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Participants')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to plan')).toBeInTheDocument();
    expect(screen.getByTestId('add-participant-button')).toBeInTheDocument();
    expect(screen.getByText(/add participant/i)).toBeInTheDocument();
    expect(screen.getByText('Group Details')).toBeInTheDocument();
    expect(screen.getByText('Join Requests')).toBeInTheDocument();
  });

  it('shows Add Participant button and opens modal when clicked', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/manage-participants/plan-1');

    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-participant-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('add-participant-button'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
    });
  });

  it('shows existing participants in ParticipantDetails', async () => {
    window.history.pushState({}, '', '/manage-participants/plan-1');

    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Group Details')).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole('button', { name: /Group Details/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    });
  });

  it('shows join requests section with empty state when no requests', async () => {
    window.history.pushState({}, '', '/manage-participants/plan-1');

    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Join Requests')).toBeInTheDocument();
      expect(screen.getByText('No pending join requests')).toBeInTheDocument();
    });
  });

  it('shows join requests when plan has joinRequests', async () => {
    const { usePlan } = await import('../../../src/hooks/usePlan');
    vi.mocked(usePlan).mockReturnValue({
      data: buildPlan({ joinRequests: [buildJoinRequest()] }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePlan>);

    window.history.pushState({}, '', '/manage-participants/plan-1');

    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Join Requests')).toBeInTheDocument();
      expect(screen.getByText('Bob Requester')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('redirects non-owner to plan page', async () => {
    const { useAuth } = await import('../../../src/contexts/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'token' },
      user: { id: 'other-user-id', email: 'other@test.com' },
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    } as ReturnType<typeof useAuth>);

    window.history.pushState({}, '', '/manage-participants/plan-1');

    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/plan/$planId',
      params: { planId: 'plan-1' },
    });
  });
});
