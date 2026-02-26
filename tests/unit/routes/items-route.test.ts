import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';

const getSessionMock = supabase.auth.getSession as ReturnType<typeof vi.fn>;

describe('items.$planId route — beforeLoad auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /signin when no session and no token', async () => {
    getSessionMock.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { Route } = await import('../../../src/routes/items.$planId');

    const options = Route.options as {
      beforeLoad: (ctx: {
        params: { planId: string };
        search: { token?: string };
      }) => Promise<void>;
    };

    try {
      await options.beforeLoad({
        params: { planId: 'plan-abc' },
        search: {},
      });
      expect.fail('Expected redirect to be thrown');
    } catch (err) {
      const redirect = err as {
        options: { to: string; search: { redirect: string } };
      };
      expect(redirect.options.to).toBe('/signin');
      expect(redirect.options.search.redirect).toBe('/items/plan-abc');
    }
  });

  it('does not redirect when session exists and no token', async () => {
    getSessionMock.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'fake-token',
          user: { id: 'user-1', email: 'a@b.com' },
        },
      },
      error: null,
    });

    const { Route } = await import('../../../src/routes/items.$planId');

    const options = Route.options as {
      beforeLoad: (ctx: {
        params: { planId: string };
        search: { token?: string };
      }) => Promise<void>;
    };

    await expect(
      options.beforeLoad({
        params: { planId: 'plan-abc' },
        search: {},
      })
    ).resolves.toBeUndefined();
  });

  it('skips auth check when token is present (guest mode)', async () => {
    const { Route } = await import('../../../src/routes/items.$planId');

    const options = Route.options as {
      beforeLoad: (ctx: {
        params: { planId: string };
        search: { token?: string };
      }) => Promise<void>;
    };

    await expect(
      options.beforeLoad({
        params: { planId: 'plan-abc' },
        search: { token: 'invite-token-123' },
      })
    ).resolves.toBeUndefined();

    expect(getSessionMock).not.toHaveBeenCalled();
  });
});
