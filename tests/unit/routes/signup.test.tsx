import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../../../src/lib/supabase';

const mockSupabase = vi.mocked(supabase);

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => () => ({ component: undefined }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useSearch: () => ({}),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

import toast from 'react-hot-toast';
import { SignUp } from '../../../src/routes/signup.lazy';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderSignUp() {
  return render(
    <QueryClientProvider client={queryClient}>
      <SignUp />
    </QueryClientProvider>
  );
}

describe('Sign Up Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    } as never);
  });

  it('renders email and password fields', async () => {
    await renderSignUp();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders link to sign in page', async () => {
    await renderSignUp();

    const link = screen.getByText(/sign in/i);
    expect(link.closest('a')).toHaveAttribute('href', '/signin');
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    await renderSignUp();

    await user.click(screen.getByRole('button', { name: /^sign up$/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    await renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), '12');
    await user.click(screen.getByRole('button', { name: /^sign up$/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation message when email confirmation is required', async () => {
    const user = userEvent.setup();
    await renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign up$/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to /plans when session is returned (no confirmation)', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: '1', email: 'new@test.com' },
      },
      error: null,
    } as never);

    const user = userEvent.setup();
    await renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign up$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/plans' });
    });
  });

  it('shows toast error on sign-up failure', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Email already registered' },
    } as never);

    const user = userEvent.setup();
    await renderSignUp();

    await user.type(screen.getByLabelText(/email/i), 'existing@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign up$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already registered');
    });
  });

  it('renders Sign up with Google button', async () => {
    await renderSignUp();

    expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
  });

  it('calls signInWithOAuth with redirectTo pointing to /plans', async () => {
    const user = userEvent.setup();
    await renderSignUp();

    await user.click(screen.getByText(/sign up with google/i));

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: expect.stringContaining('/plans'),
      }),
    });
  });

  it('navigates to /plans when OAuth returns no redirect URL (mock mode)', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: '' },
      error: null,
    } as never);

    const user = userEvent.setup();
    await renderSignUp();

    await user.click(screen.getByText(/sign up with google/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/plans' });
    });
  });

  it('does not navigate when OAuth returns a redirect URL (real Supabase)', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2' },
      error: null,
    } as never);

    const user = userEvent.setup();
    await renderSignUp();

    await user.click(screen.getByText(/sign up with google/i));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows toast error when Google OAuth fails', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: null },
      error: { message: 'OAuth provider error' },
    } as never);

    const user = userEvent.setup();
    await renderSignUp();

    await user.click(screen.getByText(/sign up with google/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('OAuth provider error');
    });
  });
});
