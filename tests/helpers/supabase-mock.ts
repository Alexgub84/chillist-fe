import { vi } from 'vitest';

interface MockSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, unknown>;
  };
}

const DEFAULT_SESSION: MockSession = {
  access_token: 'mock-access-token-xyz',
  refresh_token: 'mock-refresh-token-xyz',
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@chillist.dev',
    user_metadata: { full_name: 'Test User' },
  },
};

export function createSupabaseMock(
  overrides?: Partial<{ session: MockSession | null }>
) {
  const session = overrides?.session === undefined ? null : overrides.session;

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session, user: session?.user ?? null },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com' },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: session?.user ?? null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      }),
    },
  };
}

export { DEFAULT_SESSION };
export type { MockSession };
