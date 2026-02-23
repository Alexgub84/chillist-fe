import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthProvider from '../../../src/contexts/AuthProvider';
import { useAuth } from '../../../src/contexts/useAuth';
import { supabase } from '../../../src/lib/supabase';
import { emitAuthError } from '../../../src/core/auth-error';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSupabase = vi.mocked(supabase);

function AuthConsumer() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <span data-testid="email">{user.email}</span>
      <span data-testid="first-name">
        {(user.user_metadata?.first_name as string) ?? ''}
      </span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never);
  });

  it('shows not authenticated when no session', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  it('shows user email when session exists', async () => {
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      user: {
        id: 'user-1',
        email: 'test@chillist.dev',
        user_metadata: {},
      },
    };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never);

    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent(
        'test@chillist.dev'
      );
    });
  });

  it('calls supabase.auth.signOut when signOut is invoked', async () => {
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      user: {
        id: 'user-1',
        email: 'test@chillist.dev',
        user_metadata: {},
      },
    };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never);

    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('email')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sign Out'));
    expect(mockSupabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('subscribes to onAuthStateChange on mount', () => {
    renderWithProvider();
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledOnce();
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    } as never);

    const { unmount } = renderWithProvider();
    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('updates state when onAuthStateChange fires SIGNED_IN', async () => {
    let authCallback: (...args: unknown[]) => void = () => {};
    mockSupabase.auth.onAuthStateChange.mockImplementation(
      (cb: (...args: unknown[]) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
      }
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    const newSession = {
      access_token: 'new-token',
      refresh_token: 'new-refresh',
      user: {
        id: 'user-2',
        email: 'new@chillist.dev',
        user_metadata: {},
      },
    };

    await act(async () => {
      authCallback('SIGNED_IN', newSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('new@chillist.dev');
    });
  });

  it('clears state when onAuthStateChange fires SIGNED_OUT', async () => {
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      user: {
        id: 'user-1',
        email: 'test@chillist.dev',
        user_metadata: {},
      },
    };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never);

    let authCallback: (...args: unknown[]) => void = () => {};
    mockSupabase.auth.onAuthStateChange.mockImplementation(
      (cb: (...args: unknown[]) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
      }
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent(
        'test@chillist.dev'
      );
    });

    await act(async () => {
      authCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  it('updates user metadata when onAuthStateChange fires USER_UPDATED', async () => {
    const initialSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      user: {
        id: 'user-1',
        email: 'test@chillist.dev',
        user_metadata: {},
      },
    };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: initialSession },
      error: null,
    } as never);

    let authCallback: (...args: unknown[]) => void = () => {};
    mockSupabase.auth.onAuthStateChange.mockImplementation(
      (cb: (...args: unknown[]) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
      }
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('first-name')).toHaveTextContent('');
    });

    const updatedSession = {
      ...initialSession,
      user: {
        ...initialSession.user,
        user_metadata: { first_name: 'Alex' },
      },
    };

    await act(async () => {
      authCallback('USER_UPDATED', updatedSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('first-name')).toHaveTextContent('Alex');
    });
  });

  it('shows AuthErrorModal when emitAuthError is called', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    expect(screen.queryByText('Session Expired')).not.toBeInTheDocument();

    act(() => {
      emitAuthError();
    });

    await waitFor(() => {
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });
  });

  it('closes AuthErrorModal when Dismiss is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    act(() => {
      emitAuthError();
    });

    await waitFor(() => {
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Dismiss'));

    await waitFor(() => {
      expect(screen.queryByText('Session Expired')).not.toBeInTheDocument();
    });
  });
});
