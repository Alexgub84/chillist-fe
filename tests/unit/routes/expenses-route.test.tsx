import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from '../../../src/routeTree.gen';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';
import type { NotParticipantResponse } from '../../../src/core/schemas/plan';
import type { ExpensesResponse } from '../../../src/core/schemas/expense';

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

vi.mock('../../../src/hooks/useExpenses', () => ({
  useExpenses: vi.fn(),
}));

const mockCreateMutateAsync = vi.fn();
vi.mock('../../../src/hooks/useCreateExpense', () => ({
  useCreateExpense: vi.fn(() => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  })),
}));

const mockUpdateMutateAsync = vi.fn();
vi.mock('../../../src/hooks/useUpdateExpense', () => ({
  useUpdateExpense: vi.fn(() => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  })),
}));

const mockDeleteMutateAsync = vi.fn();
vi.mock('../../../src/hooks/useDeleteExpense', () => ({
  useDeleteExpense: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
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

function buildParticipant(overrides?: Record<string, unknown>) {
  return {
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
    inviteStatus: 'accepted',
    rsvpStatus: 'confirmed',
    lastActivityAt: null,
    adultsCount: 2,
    kidsCount: 1,
    foodPreferences: null,
    allergies: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

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
      buildParticipant(),
      buildParticipant({
        participantId: 'p-2',
        userId: 'bob-user-id',
        name: 'Bob',
        lastName: 'Helper',
        role: 'participant',
        rsvpStatus: 'pending',
      }),
    ],
    ...overrides,
  } as PlanWithDetails;
}

function buildNotParticipantResponse(): NotParticipantResponse {
  return {
    status: 'not_participant',
    preview: {
      title: 'Test Plan',
      description: null,
      startDate: '2026-07-10T09:00:00Z',
      endDate: '2026-07-12T18:00:00Z',
      location: null,
    },
    joinRequest: null,
  } as NotParticipantResponse;
}

function buildExpensesData(
  overrides?: Partial<ExpensesResponse>
): ExpensesResponse {
  return {
    expenses: [],
    summary: [],
    ...overrides,
  };
}

describe('Expenses route', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { useAuth } = await import('../../../src/contexts/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'token' },
      user: { id: 'owner-user-id', email: 'owner@test.com' },
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    } as ReturnType<typeof useAuth>);
  });

  async function renderExpensesPage() {
    window.history.pushState({}, '', '/expenses/plan-1');
    const router = createRouter({ routeTree });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  }

  describe('non-participant handling (Bug 1)', () => {
    it('navigates away when user is not a participant', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildNotParticipantResponse(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData(),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.queryByTestId('add-expense-btn')).not.toBeInTheDocument();
      });
    });
  });

  describe('loading and error states', () => {
    it('shows loading spinner while plan is loading', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });
  });

  describe('expense list display', () => {
    it('shows empty state when no expenses', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData(),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getByText(/no expenses/i)).toBeInTheDocument();
      });
    });

    it('shows expense list with amounts and participant names', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '25.50',
              description: 'Groceries',
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 25.5 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getAllByText(/25\.50/).length).toBeGreaterThan(0);
        expect(screen.getByText('Groceries')).toBeInTheDocument();
      });
    });
  });

  describe('participant name display (Bug 4)', () => {
    it('uses displayName when available', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      const plan = buildPlan({
        participants: [
          buildParticipant({ displayName: 'Ali' }),
          buildParticipant({
            participantId: 'p-2',
            userId: 'bob-user-id',
            name: 'Bob',
            lastName: 'Helper',
            displayName: 'Bobby',
            role: 'participant',
          }),
        ] as PlanWithDetails['participants'],
      });

      vi.mocked(usePlan).mockReturnValue({
        data: plan,
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-2',
              planId: 'plan-1',
              amount: '10.00',
              description: null,
              createdByUserId: 'bob-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-2', totalAmount: 10 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getAllByText('Bobby').length).toBeGreaterThan(0);
        expect(screen.queryByText('Bob Helper')).not.toBeInTheDocument();
      });
    });

    it('falls back to name + lastName when displayName is null', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '15.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 15 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getAllByText('Alice Owner').length).toBeGreaterThan(0);
      });
    });

    it('shows truncated ID for unknown participant', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'unknown-participant-id-long',
              planId: 'plan-1',
              amount: '5.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [
            { participantId: 'unknown-participant-id-long', totalAmount: 5 },
          ],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getAllByText('unknown-').length).toBeGreaterThan(0);
      });
    });
  });

  describe('summary and settlement', () => {
    it('shows summary with per-participant totals and grand total', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '60.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [
            { participantId: 'p-1', totalAmount: 60 },
            { participantId: 'p-2', totalAmount: 0 },
          ],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getAllByText(/60\.00/).length).toBeGreaterThan(0);
      });
    });

    it('shows settlement card when multiple participants have expenses', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '100.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 100 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getByTestId('settlement-card')).toBeInTheDocument();
      });
    });

    it('hides settlement card with only one participant', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      const singleParticipantPlan = buildPlan({
        participants: [buildParticipant()] as PlanWithDetails['participants'],
      });

      vi.mocked(usePlan).mockReturnValue({
        data: singleParticipantPlan,
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '50.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 50 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.queryByTestId('settlement-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('edit and delete permissions', () => {
    it('shows edit/delete buttons for own expenses', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '20.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 20 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getByTestId('edit-expense-exp-1')).toBeInTheDocument();
        expect(screen.getByTestId('delete-expense-exp-1')).toBeInTheDocument();
      });
    });

    it('hides edit/delete buttons for non-owner viewing others expenses', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');
      const { useAuth } = await import('../../../src/contexts/useAuth');

      vi.mocked(useAuth).mockReturnValue({
        session: { access_token: 'token' },
        user: { id: 'bob-user-id', email: 'bob@test.com' },
        loading: false,
        isAdmin: false,
        signOut: vi.fn(),
      } as ReturnType<typeof useAuth>);

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '20.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 20 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(
          screen.queryByTestId('edit-expense-exp-1')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('delete-expense-exp-1')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('CRUD operations', () => {
    it('opens add expense modal on button click', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData(),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('add-expense-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-expense-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('add-expense-modal')).toBeInTheDocument();
      });
    });

    it('opens edit expense modal on edit button click', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '30.00',
              description: 'Test',
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 30 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('edit-expense-exp-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-expense-exp-1'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-expense-modal')).toBeInTheDocument();
      });
    });

    it('opens delete confirmation modal on delete button click', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '30.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 30 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('delete-expense-exp-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-expense-exp-1'));

      await waitFor(() => {
        expect(screen.getByTestId('delete-expense-modal')).toBeInTheDocument();
        expect(
          screen.getByTestId('confirm-delete-expense')
        ).toBeInTheDocument();
      });
    });

    it('calls delete mutation and shows success toast', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');
      const toast = await import('react-hot-toast');

      mockDeleteMutateAsync.mockResolvedValueOnce(undefined);

      vi.mocked(usePlan).mockReturnValue({
        data: buildPlan(),
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '10.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: [],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 10 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('delete-expense-exp-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-expense-exp-1'));

      await waitFor(() => {
        expect(
          screen.getByTestId('confirm-delete-expense')
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('confirm-delete-expense'));

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('exp-1');
        expect(toast.default.success).toHaveBeenCalled();
      });
    });
  });

  describe('linked items display', () => {
    it('shows linked item names as chips on expense cards', async () => {
      const { usePlan } = await import('../../../src/hooks/usePlan');
      const { useExpenses } = await import('../../../src/hooks/useExpenses');

      const plan = buildPlan({
        items: [
          {
            itemId: 'item-1',
            planId: 'plan-1',
            name: 'Tent',
            category: 'equipment',
            quantity: 1,
            unit: 'pcs',
            assignmentStatusList: [],
            isAllParticipants: false,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ] as PlanWithDetails['items'],
      });

      vi.mocked(usePlan).mockReturnValue({
        data: plan,
        isLoading: false,
        error: null,
      } as ReturnType<typeof usePlan>);

      vi.mocked(useExpenses).mockReturnValue({
        data: buildExpensesData({
          expenses: [
            {
              expenseId: 'exp-1',
              participantId: 'p-1',
              planId: 'plan-1',
              amount: '25.00',
              description: null,
              createdByUserId: 'owner-user-id',
              itemIds: ['item-1'],
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
            },
          ],
          summary: [{ participantId: 'p-1', totalAmount: 25 }],
        }),
        isLoading: false,
      } as ReturnType<typeof useExpenses>);

      await renderExpensesPage();

      await waitFor(() => {
        expect(screen.getByText('Tent')).toBeInTheDocument();
      });
    });
  });
});
