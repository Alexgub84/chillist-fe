import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../api/server';
import { supabase } from '../../src/lib/supabase';
import AuthProvider from '../../src/contexts/AuthProvider';
import { SignIn } from '../../src/routes/signin.lazy';
import { SignUp } from '../../src/routes/signup.lazy';
import {
  storePendingInvite,
  getPendingInvite,
  clearPendingInvite,
} from '../../src/core/pending-invite';

const mockSupabase = vi.mocked(supabase);

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => () => ({ component: undefined }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useSearch: () => ({ redirect: '/plan/test-plan' }),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

function makeFakeJwt(email: string, userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      email,
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  return `${header}.${payload}.mock-signature`;
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, unknown>;
    aud: string;
    role: string;
  };
}

function buildMockSession(email: string, userId?: string): MockSession {
  const uid = userId ?? crypto.randomUUID();
  return {
    access_token: makeFakeJwt(email, uid),
    refresh_token: `mock-refresh-${uid}`,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: uid,
      email,
      user_metadata: { full_name: email.split('@')[0] },
      aud: 'authenticated',
      role: 'authenticated',
    },
  };
}

interface SeededData {
  planId: string;
  participantId: string;
  inviteToken: string;
}

async function seedPlanWithParticipant(
  server: FastifyInstance
): Promise<SeededData> {
  const planRes = await server.inject({
    method: 'POST',
    url: '/plans',
    payload: { title: 'Invite Test Plan' },
  });
  const plan = planRes.json() as { planId: string };

  const partRes = await server.inject({
    method: 'POST',
    url: `/plans/${plan.planId}/participants`,
    payload: { name: 'Guest', lastName: 'User', contactPhone: '+1234567890' },
  });
  const participant = partRes.json() as {
    participantId: string;
    inviteToken: string;
  };

  return {
    planId: plan.planId,
    participantId: participant.participantId,
    inviteToken: participant.inviteToken,
  };
}

let server: FastifyInstance;
let authChangeCallback: (...args: unknown[]) => void;
let currentSession: MockSession | null;

beforeAll(async () => {
  server = await buildServer({ persist: false, logger: false });
  await server.listen({ port: 0, host: '127.0.0.1' });
  const addr = server.server.address() as { port: number };
  vi.stubEnv('VITE_API_URL', `http://127.0.0.1:${addr.port}`);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await server.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  currentSession = null;
  authChangeCallback = () => {};
  clearPendingInvite();

  mockSupabase.auth.getSession.mockImplementation(async () => ({
    data: { session: currentSession },
    error: null,
  }));

  mockSupabase.auth.onAuthStateChange.mockImplementation(
    (cb: (...args: unknown[]) => void) => {
      authChangeCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    }
  );

  mockSupabase.auth.signInWithPassword.mockImplementation(
    async ({ email }: { email: string }) => {
      const session = buildMockSession(email);
      currentSession = session;
      setTimeout(() => authChangeCallback('SIGNED_IN', session), 0);
      return { data: { session, user: session.user }, error: null } as never;
    }
  );

  mockSupabase.auth.signUp.mockImplementation(
    async ({ email }: { email: string }) => {
      const session = buildMockSession(email);
      currentSession = session;
      setTimeout(() => authChangeCallback('SIGNED_IN', session), 0);
      return { data: { session, user: session.user }, error: null } as never;
    }
  );

  mockSupabase.auth.signInWithOAuth.mockImplementation(async () => {
    const session = buildMockSession('google-user@example.com');
    currentSession = session;
    setTimeout(() => authChangeCallback('SIGNED_IN', session), 0);
    return { data: { provider: 'google', url: '' }, error: null } as never;
  });
});

function renderWithAuth(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

describe('Invite Flow Integration', () => {
  describe('Public invite endpoint (GET /plans/:planId/invite/:inviteToken)', () => {
    it('returns plan data with PII-stripped participants for a valid token', async () => {
      const { planId, inviteToken } = await seedPlanWithParticipant(server);

      const res = await server.inject({
        method: 'GET',
        url: `/plans/${planId}/invite/${inviteToken}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.planId).toBe(planId);
      expect(body.title).toBe('Invite Test Plan');
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('participants');

      const participants = body.participants as Record<string, unknown>[];
      expect(participants.length).toBeGreaterThan(0);
      const p = participants[0];
      expect(p).toHaveProperty('participantId');
      expect(p).toHaveProperty('displayName');
      expect(p).toHaveProperty('role');
      expect(p).not.toHaveProperty('contactPhone');
      expect(p).not.toHaveProperty('contactEmail');
      expect(p).not.toHaveProperty('allergies');
    });

    it('returns 404 for an invalid invite token', async () => {
      const { planId } = await seedPlanWithParticipant(server);

      const res = await server.inject({
        method: 'GET',
        url: `/plans/${planId}/invite/bad-token-does-not-exist`,
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 404 for a non-existent plan', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/plans/00000000-0000-0000-0000-000000000000/invite/any-token`,
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Claim endpoint (POST /plans/:planId/claim/:inviteToken)', () => {
    it('links user to participant with a valid JWT', async () => {
      const { planId, inviteToken, participantId } =
        await seedPlanWithParticipant(server);
      const userId = crypto.randomUUID();
      const jwt = makeFakeJwt('claimer@test.com', userId);

      const res = await server.inject({
        method: 'POST',
        url: `/plans/${planId}/claim/${inviteToken}`,
        headers: { authorization: `Bearer ${jwt}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        participantId: string;
        userId: string;
        inviteStatus: string;
      };
      expect(body.participantId).toBe(participantId);
      expect(body.userId).toBe(userId);
      expect(body.inviteStatus).toBe('accepted');
    });

    it('returns 401 without an Authorization header', async () => {
      const { planId, inviteToken } = await seedPlanWithParticipant(server);

      const res = await server.inject({
        method: 'POST',
        url: `/plans/${planId}/claim/${inviteToken}`,
      });

      expect(res.statusCode).toBe(401);
    });

    it('returns 400 when invite is already claimed', async () => {
      const { planId, inviteToken } = await seedPlanWithParticipant(server);
      const jwt = makeFakeJwt('first@test.com', crypto.randomUUID());

      await server.inject({
        method: 'POST',
        url: `/plans/${planId}/claim/${inviteToken}`,
        headers: { authorization: `Bearer ${jwt}` },
      });

      const res = await server.inject({
        method: 'POST',
        url: `/plans/${planId}/claim/${inviteToken}`,
        headers: { authorization: `Bearer ${jwt}` },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for an invalid invite token', async () => {
      const { planId } = await seedPlanWithParticipant(server);
      const jwt = makeFakeJwt('user@test.com', crypto.randomUUID());

      const res = await server.inject({
        method: 'POST',
        url: `/plans/${planId}/claim/wrong-token`,
        headers: { authorization: `Bearer ${jwt}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Email sign-in with pending invite', () => {
    it('awaits claimInvite before navigating and clears localStorage', async () => {
      const { planId, inviteToken, participantId } =
        await seedPlanWithParticipant(server);
      storePendingInvite(planId, inviteToken);

      const user = userEvent.setup();
      renderWithAuth(<SignIn />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), 'invite@test.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      expect(getPendingInvite()).toBeNull();

      const verifyRes = await server.inject({
        method: 'GET',
        url: `/plans/${planId}/invite/${inviteToken}`,
      });
      expect(verifyRes.statusCode).toBe(200);

      const partRes = await server.inject({
        method: 'GET',
        url: `/participants/${participantId}`,
      });
      const part = partRes.json() as {
        inviteStatus: string;
        userId?: string;
      };
      expect(part.inviteStatus).toBe('accepted');
      expect(part.userId).toBeDefined();
    });
  });

  describe('Email sign-up with pending invite', () => {
    it('awaits claimInvite before navigating and clears localStorage', async () => {
      const { planId, inviteToken, participantId } =
        await seedPlanWithParticipant(server);
      storePendingInvite(planId, inviteToken);

      const user = userEvent.setup();
      renderWithAuth(<SignUp />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), 'newguest@test.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      expect(getPendingInvite()).toBeNull();

      const partRes = await server.inject({
        method: 'GET',
        url: `/participants/${participantId}`,
      });
      const part = partRes.json() as {
        inviteStatus: string;
        userId?: string;
      };
      expect(part.inviteStatus).toBe('accepted');
      expect(part.userId).toBeDefined();
    });
  });

  describe('Google OAuth with pending invite', () => {
    it('redirects OAuth to invite page URL instead of plan page', async () => {
      const { planId, inviteToken } = await seedPlanWithParticipant(server);
      storePendingInvite(planId, inviteToken);

      const user = userEvent.setup();
      renderWithAuth(<SignIn />);

      await waitFor(() => {
        expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/sign in with google/i));

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining(
            `/invite/${planId}/${inviteToken}`
          ),
        },
      });
    });

    it('AuthProvider claims invite on SIGNED_IN event (OAuth fallback)', async () => {
      const { planId, inviteToken, participantId } =
        await seedPlanWithParticipant(server);
      storePendingInvite(planId, inviteToken);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const session = buildMockSession('oauth@test.com');
      currentSession = session;

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      } as never);

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div>loaded</div>
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('loaded')).toBeInTheDocument();
      });

      await act(async () => {
        authChangeCallback('SIGNED_IN', session);
      });

      await waitFor(async () => {
        const partRes = await server.inject({
          method: 'GET',
          url: `/participants/${participantId}`,
        });
        const part = partRes.json() as {
          inviteStatus: string;
          userId?: string;
        };
        expect(part.inviteStatus).toBe('accepted');
      });

      expect(getPendingInvite()).toBeNull();
    });
  });

  describe('Sign-in without pending invite (baseline)', () => {
    it('navigates to /plans without calling claim', async () => {
      const { participantId } = await seedPlanWithParticipant(server);

      const user = userEvent.setup();
      renderWithAuth(<SignIn />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), 'regular@test.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      const partRes = await server.inject({
        method: 'GET',
        url: `/participants/${participantId}`,
      });
      const part = partRes.json() as {
        inviteStatus: string;
        userId?: string;
      };
      expect(part.inviteStatus).toBe('invited');
      expect(part.userId).toBeUndefined();
    });
  });

  describe('Guest preferences (mock-only — not yet in production BE)', () => {
    it('PATCH updates participant preferences via invite token', async () => {
      const { planId, inviteToken, participantId } =
        await seedPlanWithParticipant(server);

      const res = await server.inject({
        method: 'PATCH',
        url: `/plans/${planId}/invite/${inviteToken}/preferences`,
        payload: {
          adultsCount: 2,
          kidsCount: 1,
          foodPreferences: 'vegetarian',
          allergies: 'nuts',
          notes: 'Arriving late',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        participantId: string;
        displayName: string;
        role: string;
      };
      expect(body.participantId).toBe(participantId);
      expect(body.role).toBe('participant');

      const partRes = await server.inject({
        method: 'GET',
        url: `/participants/${participantId}`,
      });
      const part = partRes.json() as {
        adultsCount: number;
        kidsCount: number;
        foodPreferences: string;
        allergies: string;
        notes: string;
      };
      expect(part.adultsCount).toBe(2);
      expect(part.kidsCount).toBe(1);
      expect(part.foodPreferences).toBe('vegetarian');
      expect(part.allergies).toBe('nuts');
      expect(part.notes).toBe('Arriving late');
    });

    it('returns 404 for invalid invite token', async () => {
      const { planId } = await seedPlanWithParticipant(server);

      const res = await server.inject({
        method: 'PATCH',
        url: `/plans/${planId}/invite/wrong-token/preferences`,
        payload: { adultsCount: 1 },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
