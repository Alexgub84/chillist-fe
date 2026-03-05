import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from '../../src/routeTree.gen';
import type {
  PlanWithDetails,
  NotParticipantResponse,
} from '../../src/core/schemas/plan';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/hooks/usePlan', () => ({ usePlan: vi.fn() }));
vi.mock('../../src/contexts/useAuth', () => ({ useAuth: vi.fn() }));

vi.mock('../../src/hooks/useCreateItem', () => ({
  useCreateItem: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));
vi.mock('../../src/hooks/useUpdateItem', () => ({
  useUpdateItem: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));
vi.mock('../../src/hooks/useDeletePlan', () => ({
  useDeletePlan: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));
vi.mock('../../src/hooks/useUpdatePlan', () => ({
  useUpdatePlan: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));
vi.mock('../../src/hooks/useUpdateParticipant', () => ({
  useUpdateParticipant: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));
vi.mock('../../src/hooks/useBulkAssign', () => ({
  useBulkAssign: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hot-toast')>();
  return { ...actual, default: { success: vi.fn(), error: vi.fn() } };
});

vi.mock('../../src/lib/supabase', () => ({
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
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const ts = '2026-01-01T00:00:00Z';

function buildPlan(overrides?: Partial<PlanWithDetails>): PlanWithDetails {
  return {
    planId: 'plan-1',
    title: 'Summer BBQ',
    description: 'Annual neighborhood cookout',
    status: 'active',
    visibility: 'private',
    ownerParticipantId: 'p-1',
    startDate: '2026-07-10T09:00:00Z',
    endDate: '2026-07-12T18:00:00Z',
    tags: null,
    createdAt: ts,
    updatedAt: ts,
    items: [
      {
        itemId: 'item-1',
        planId: 'plan-1',
        name: 'Burgers',
        category: 'food',
        quantity: 20,
        unit: 'units',
        isAllParticipants: false,
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        itemId: 'item-2',
        planId: 'plan-1',
        name: 'Paper plates',
        category: 'equipment',
        quantity: 50,
        unit: 'units',
        isAllParticipants: false,
        assignmentStatusList: [{ participantId: 'p-2', status: 'pending' }],
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    ],
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
        createdAt: ts,
        updatedAt: ts,
      },
      {
        participantId: 'p-2',
        planId: 'plan-1',
        userId: 'guest-user-id',
        name: 'Bob',
        lastName: 'Guest',
        contactPhone: '555-0002',
        displayName: null,
        role: 'participant',
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
        createdAt: ts,
        updatedAt: ts,
      },
    ],
    ...overrides,
  };
}

describe('PlanRoute — Integration', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { usePlan } = await import('../../src/hooks/usePlan');
    const { useAuth } = await import('../../src/contexts/useAuth');

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

  function renderPlanRoute() {
    window.history.pushState({}, '', '/plan/plan-1');
    const router = createRouter({ routeTree });
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  }

  describe('owner sees full plan with role-based UI', () => {
    it('renders plan title, details, and manage participants link for owner', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(
          screen.getByTestId('manage-participants-link')
        ).toBeInTheDocument();
      });
      const titles = screen.getAllByTestId('plan-title');
      expect(titles[0]).toHaveTextContent('Summer BBQ');
      expect(
        screen.getByText('Annual neighborhood cookout')
      ).toBeInTheDocument();
    });

    it('shows items list with correct items', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('item-card-item-1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('item-card-item-2')).toBeInTheDocument();
    });

    it('shows item count', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('items-count')).toBeInTheDocument();
      });

      expect(screen.getByTestId('items-count')).toHaveTextContent('(2)');
    });

    it('renders the add item FAB button', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByText('Add Item')).toBeInTheDocument();
      });
    });

    it('renders the Add Multiple FAB button for owner', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('bulk-add-fab')).toBeInTheDocument();
      });
      expect(screen.getByTestId('bulk-add-fab')).toHaveTextContent(
        /Add Multiple/i
      );
    });

    it('opens BulkItemAddWizard when Add Multiple FAB is clicked', async () => {
      const user = userEvent.setup();
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('bulk-add-fab')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('bulk-add-fab'));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Add Multiple Items/i })
        ).toBeInTheDocument();
      });
      const dialog = screen.getByRole('dialog', {
        name: /Add Multiple Items/i,
      });
      expect(within(dialog).getByText('Equipment')).toBeInTheDocument();
      expect(within(dialog).getByText('Food')).toBeInTheDocument();
    });
  });

  describe('non-owner participant sees restricted UI', () => {
    beforeEach(async () => {
      const { useAuth } = await import('../../src/contexts/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        session: { access_token: 'token' },
        user: { id: 'guest-user-id', email: 'guest@test.com' },
        loading: false,
        isAdmin: false,
        signOut: vi.fn(),
      } as ReturnType<typeof useAuth>);
    });

    it('hides manage participants link for non-owner', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('item-card-item-1')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('manage-participants-link')
      ).not.toBeInTheDocument();
    });

    it('still shows items and FAB for non-owner', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('item-card-item-1')).toBeInTheDocument();
      });

      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });
  });

  describe('not_participant response renders RequestToJoinPage', () => {
    beforeEach(async () => {
      const { usePlan } = await import('../../src/hooks/usePlan');
      const notParticipant: NotParticipantResponse = {
        status: 'not_participant',
        preview: {
          title: 'Private Party',
          description: 'Invite only event',
          startDate: '2026-08-01T18:00:00Z',
          endDate: '2026-08-01T23:00:00Z',
        },
        joinRequest: null,
      };
      vi.mocked(usePlan).mockReturnValue({
        data: notParticipant,
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);
    });

    it('renders plan preview and join request form instead of plan UI', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('plan-preview-card')).toBeInTheDocument();
      });

      expect(screen.getByText('Private Party')).toBeInTheDocument();
      expect(screen.getByTestId('join-request-form')).toBeInTheDocument();
      expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('shows loading indicator while plan is loading', async () => {
      const { usePlan } = await import('../../src/hooks/usePlan');
      vi.mocked(usePlan).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof usePlan>);

      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });
  });

  describe('utility functions integration (counting/filtering)', () => {
    it('shows participant filter when items and participants exist', async () => {
      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByTestId('participant-filter')).toBeInTheDocument();
      });

      expect(screen.getByTestId('participant-filter-p-2')).toBeInTheDocument();
    });

    it('shows empty items message when no items', async () => {
      const { usePlan } = await import('../../src/hooks/usePlan');
      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan({ items: [] }),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      renderPlanRoute();

      await waitFor(() => {
        expect(screen.getByText(/no items/i)).toBeInTheDocument();
      });
    });
  });
});
