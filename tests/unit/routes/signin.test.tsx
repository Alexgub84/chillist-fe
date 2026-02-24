import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import { SignIn } from '../../../src/routes/signin.lazy';

function renderSignIn() {
  return render(<SignIn />);
}

describe('Sign In Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: '1', email: 'a@b.com' },
      },
      error: null,
    } as never);
  });

  it('renders email and password fields', async () => {
    await renderSignIn();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders Sign in with Google button', async () => {
    await renderSignIn();

    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it('renders link to sign up page', async () => {
    await renderSignIn();

    const link = screen.getByText(/sign up/i);
    expect(link.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    await renderSignIn();

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    await renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), '123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6/i)).toBeInTheDocument();
    });
  });

  it('calls signInWithPassword and navigates on success', async () => {
    const user = userEvent.setup();
    await renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/plans' });
    });
  });

  it('shows toast error on sign-in failure', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid credentials' },
    } as never);

    const user = userEvent.setup();
    await renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('calls signInWithOAuth with redirectTo pointing to /plans', async () => {
    const user = userEvent.setup();
    renderSignIn();

    await user.click(screen.getByText(/sign in with google/i));

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
    renderSignIn();

    await user.click(screen.getByText(/sign in with google/i));

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
    renderSignIn();

    await user.click(screen.getByText(/sign in with google/i));

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
