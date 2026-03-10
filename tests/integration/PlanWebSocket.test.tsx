import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from '../../src/routeTree.gen';
import type { PlanWithDetails } from '../../src/core/schemas/plan';

type MockWSInstance = {
  url: string;
  onopen: ((ev: Event) => void) | null;
  onclose: ((ev: { code: number; reason: string }) => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
};

let mockWSInstances: MockWSInstance[] = [];

class MockWebSocket {
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    mockWSInstances.push(this as unknown as MockWSInstance);
  }
}

const OriginalWebSocket = globalThis.WebSocket;

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
    planId: 'plan-ws-1',
    title: 'WebSocket Test Plan',
    description: null,
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
        planId: 'plan-ws-1',
        name: 'Tent',
        category: 'equipment',
        quantity: 1,
        unit: 'pcs',
        isAllParticipants: false,
        assignmentStatusList: [],
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    ],
    participants: [
      {
        participantId: 'p-1',
        planId: 'plan-ws-1',
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
    ],
    ...overrides,
  };
}

function getWsInstance(): MockWSInstance | undefined {
  return mockWSInstances.find((ws) => ws.url.includes('/plans/plan-ws-1/ws'));
}

describe('PlanWebSocket — Integration', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockWSInstances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

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
      session: { access_token: 'mock-token' },
      user: { id: 'owner-user-id', email: 'owner@test.com' },
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    } as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    globalThis.WebSocket = OriginalWebSocket;
  });

  function renderPlanRoute() {
    window.history.pushState({}, '', '/plan/plan-ws-1');
    const router = createRouter({ routeTree });
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  }

  it('opens WebSocket connection when plan page loads', async () => {
    renderPlanRoute();

    await waitFor(() => {
      expect(getWsInstance()).toBeDefined();
    });

    expect(getWsInstance()!.url).toContain('token=mock-token');
  });

  it('invalidates plan query when items:changed message is received', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderPlanRoute();

    await waitFor(() => {
      expect(getWsInstance()).toBeDefined();
    });

    const ws = getWsInstance()!;

    act(() => {
      ws.readyState = 1;
      ws.onopen?.(new Event('open'));
    });

    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          event: 'items:changed',
          planId: 'plan-ws-1',
        }),
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['plan', 'plan-ws-1'],
    });
  });

  it('renders plan page normally when WebSocket connection fails immediately', async () => {
    renderPlanRoute();

    await waitFor(() => {
      expect(getWsInstance()).toBeDefined();
    });

    act(() => {
      const ws = getWsInstance()!;
      ws.onerror?.();
      ws.readyState = 3;
      ws.onclose?.({ code: 1006, reason: '' });
    });

    await waitFor(() => {
      const titles = screen.getAllByTestId('plan-title');
      expect(titles[0]).toHaveTextContent('WebSocket Test Plan');
    });

    expect(screen.getByTestId('item-card-item-1')).toBeInTheDocument();
  });

  it('cleans up WebSocket on unmount', async () => {
    const { unmount } = renderPlanRoute();

    await waitFor(() => {
      expect(getWsInstance()).toBeDefined();
    });

    const ws = getWsInstance()!;
    unmount();

    expect(ws.close).toHaveBeenCalled();
  });
});
