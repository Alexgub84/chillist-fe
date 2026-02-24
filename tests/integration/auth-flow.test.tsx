import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../api/server';
import { supabase } from '../../src/lib/supabase';
import AuthProvider from '../../src/contexts/AuthProvider';
import Header from '../../src/components/Header';
import { SignUp } from '../../src/routes/signup.lazy';
import { SignIn } from '../../src/routes/signin.lazy';
import { CompleteProfile } from '../../src/routes/complete-profile.lazy';

const mockSupabase = vi.mocked(supabase);

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => () => ({ component: undefined }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

import toast from 'react-hot-toast';

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

function buildMockSession(email: string): MockSession {
  const userId = crypto.randomUUID();
  return {
    access_token: makeFakeJwt(email, userId),
    refresh_token: `mock-refresh-${userId}`,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email,
      user_metadata: { full_name: email.split('@')[0] },
      aud: 'authenticated',
      role: 'authenticated',
    },
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

  mockSupabase.auth.signUp.mockImplementation(
    async ({ email }: { email: string }) => {
      const session = buildMockSession(email);
      currentSession = session;
      setTimeout(() => authChangeCallback('SIGNED_IN', session), 0);
      return { data: { session, user: session.user }, error: null } as never;
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

  mockSupabase.auth.signInWithOAuth.mockImplementation(async () => {
    const session = buildMockSession('google-user@example.com');
    currentSession = session;
    setTimeout(() => authChangeCallback('SIGNED_IN', session), 0);
    return { data: { provider: 'google', url: '' }, error: null } as never;
  });

  mockSupabase.auth.signOut.mockImplementation(async () => {
    currentSession = null;
    setTimeout(() => authChangeCallback('SIGNED_OUT', null), 0);
    return { error: null } as never;
  });

  mockSupabase.auth.updateUser.mockImplementation(
    async ({ data }: { data: Record<string, unknown> }) => {
      if (currentSession) {
        currentSession.user.user_metadata = {
          ...currentSession.user.user_metadata,
          ...data,
        };
        setTimeout(() => authChangeCallback('USER_UPDATED', currentSession), 0);
      }
      return {
        data: { user: currentSession?.user ?? null },
        error: null,
      } as never;
    }
  );
});

function renderWithAuth(ui: React.ReactNode) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
        <Header />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Auth Flow Integration', () => {
  describe('Sign Up', () => {
    it('email/password: Header and toast show same email after sign-up', async () => {
      const testEmail = 'newuser@chillist.dev';
      const user = userEvent.setup();

      renderWithAuth(<SignUp />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), testEmail);
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(`Signed in as ${testEmail}`);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('User menu'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-email')).toHaveTextContent(testEmail);
      });
    });

    it('Google OAuth: Header and toast show same email after sign-up', async () => {
      const user = userEvent.setup();

      renderWithAuth(<SignUp />);

      await waitFor(() => {
        expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/sign up with google/i));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Signed in as google-user@example.com'
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('User menu'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-email')).toHaveTextContent(
          'google-user@example.com'
        );
      });
    });
  });

  describe('Sign In', () => {
    it('email/password: Header and toast show same email after sign-in', async () => {
      const testEmail = 'returning@chillist.dev';
      const user = userEvent.setup();

      renderWithAuth(<SignIn />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), testEmail);
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(`Signed in as ${testEmail}`);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('User menu'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-email')).toHaveTextContent(testEmail);
      });
    });

    it('Google OAuth: Header and toast show same email after sign-in', async () => {
      const user = userEvent.setup();

      renderWithAuth(<SignIn />);

      await waitFor(() => {
        expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/sign in with google/i));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Signed in as google-user@example.com'
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('User menu'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-email')).toHaveTextContent(
          'google-user@example.com'
        );
      });
    });
  });

  describe('Sign Out', () => {
    it('clears auth state and shows Sign In / Sign Up links', async () => {
      const testEmail = 'active@chillist.dev';
      const session = buildMockSession(testEmail);
      currentSession = session;

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      } as never);

      const user = userEvent.setup();

      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('User menu'));
      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('User menu')).not.toBeInTheDocument();
    });
  });

  describe('Complete Profile', () => {
    it('email sign-up -> fill profile -> updateUser called with correct data', async () => {
      const testEmail = 'fresh@chillist.dev';
      const session = buildMockSession(testEmail);
      currentSession = session;

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      } as never);

      const user = userEvent.setup();

      renderWithAuth(<CompleteProfile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/first name/i));
      await user.type(screen.getByLabelText(/first name/i), 'Fresh');
      await user.clear(screen.getByLabelText(/last name/i));
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.click(
        screen.getByRole('button', { name: /save & continue/i })
      );

      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            first_name: 'Fresh',
            last_name: 'User',
            phone: '+1234567890',
          },
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Profile updated');
      });
    });

    it('full flow: sign up -> complete profile -> updateUser -> toast', async () => {
      const testEmail = 'fullflow@chillist.dev';
      const user = userEvent.setup();

      renderWithAuth(<SignUp />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), testEmail);
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(`Signed in as ${testEmail}`);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      vi.mocked(toast.success).mockClear();

      const qc2 = new QueryClient();
      const { unmount } = render(
        <QueryClientProvider client={qc2}>
          <AuthProvider>
            <CompleteProfile />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/first name/i));
      await user.type(screen.getByLabelText(/first name/i), 'Full');
      await user.type(screen.getByLabelText(/last name/i), 'Flow');
      await user.click(
        screen.getByRole('button', { name: /save & continue/i })
      );

      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          data: { first_name: 'Full', last_name: 'Flow' },
        });
        expect(toast.success).toHaveBeenCalledWith('Profile updated');
      });

      unmount();
    });

    it('update profile -> Header reflects new name in dropdown', async () => {
      const testEmail = 'reflect@chillist.dev';
      const session = buildMockSession(testEmail);
      currentSession = session;

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      } as never);

      const user = userEvent.setup();

      renderWithAuth(<CompleteProfile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/first name/i));
      await user.type(screen.getByLabelText(/first name/i), 'Reflected');
      await user.clear(screen.getByLabelText(/last name/i));
      await user.type(screen.getByLabelText(/last name/i), 'Name');
      await user.click(
        screen.getByRole('button', { name: /save & continue/i })
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Profile updated');
      });

      await waitFor(() => {
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('User menu'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-display-name')).toHaveTextContent(
          'Reflected'
        );
      });
    });

    it('Google sign-up -> pre-fills name from metadata -> skip navigates away', async () => {
      const session = buildMockSession('google-user@example.com');
      session.user.user_metadata = {
        full_name: 'Google User',
        avatar_url: 'https://photo.example.com/pic.jpg',
      };
      currentSession = session;

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      } as never);

      renderWithAuth(<CompleteProfile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toHaveValue('Google');
        expect(screen.getByLabelText(/last name/i)).toHaveValue('User');
      });

      expect(screen.getByText(/skip for now/i).closest('a')).toHaveAttribute(
        'href',
        '/plans'
      );
    });
  });

  describe('Email consistency', () => {
    it('JWT email decoded by /auth/me matches session email for any address', async () => {
      const emails = [
        'alice@test.com',
        'bob+tag@example.org',
        'user.name@sub.domain.co',
      ];

      for (const email of emails) {
        const session = buildMockSession(email);

        const response = await server.inject({
          method: 'GET',
          url: '/auth/me',
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
        });

        const body = response.json() as { user: { email: string } };
        expect(body.user.email).toBe(email);
        expect(body.user.email).toBe(session.user.email);
      }
    });
  });
});
