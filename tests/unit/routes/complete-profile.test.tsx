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
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../../src/contexts/useAuth');

import toast from 'react-hot-toast';
import { useAuth } from '../../../src/contexts/useAuth';
import { CompleteProfile } from '../../../src/routes/complete-profile.lazy';

const mockUseAuth = vi.mocked(useAuth);

function renderPage() {
  return render(<CompleteProfile />);
}

describe('Complete Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      session: {} as never,
      user: {
        id: 'u1',
        email: 'test@test.com',
        user_metadata: {},
      } as never,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: {} },
      error: null,
    } as never);
  });

  it('renders first name, last name, phone, and email fields', () => {
    renderPage();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders Skip link to /plans', () => {
    renderPage();

    const link = screen.getByText(/skip for now/i);
    expect(link.closest('a')).toHaveAttribute('href', '/plans');
  });

  it('renders Save & Continue button', () => {
    renderPage();

    expect(
      screen.getByRole('button', { name: /save & continue/i })
    ).toBeInTheDocument();
  });

  it('pre-fills email from user.email', () => {
    renderPage();

    expect(screen.getByLabelText(/email/i)).toHaveValue('test@test.com');
  });

  it('pre-fills fields from Google user_metadata (splits full_name)', () => {
    mockUseAuth.mockReturnValue({
      session: {} as never,
      user: {
        id: 'u1',
        email: 'google@test.com',
        user_metadata: { full_name: 'Alex Guberman' },
      } as never,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderPage();

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Alex');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Guberman');
    expect(screen.getByLabelText(/email/i)).toHaveValue('google@test.com');
  });

  it('pre-fills from existing first_name/last_name/phone metadata', () => {
    mockUseAuth.mockReturnValue({
      session: {} as never,
      user: {
        id: 'u1',
        email: 'test@test.com',
        user_metadata: {
          first_name: 'Jamie',
          last_name: 'Rivera',
          phone: '+972501234567',
        },
      } as never,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderPage();

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Jamie');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Rivera');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('501234567');
    expect(screen.getByLabelText(/country code/i)).toHaveValue('IL');
  });

  it('calls updateUser with validated data on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Alex');
    await user.type(screen.getByLabelText(/last name/i), 'Guberman');
    await user.type(screen.getByLabelText(/phone/i), '+972501234567');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          first_name: 'Alex',
          last_name: 'Guberman',
          phone: '+972501234567',
        },
      });
    });
  });

  it('shows success toast and navigates to /plans on success', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Alex');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile updated');
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/plans' });
    });
  });

  it('shows error toast on updateUser failure', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed' },
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Alex');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update failed');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /plans without calling updateUser when all fields empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/plans' });
    });

    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('submits only filled fields when some are left empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Alex');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { first_name: 'Alex' },
      });
    });
  });

  it('shows validation error when first name exceeds 100 characters', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'A'.repeat(101));
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/100/i)).toBeInTheDocument();
    });

    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('blocks submission when phone exceeds 50 characters', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/phone/i), '1'.repeat(51));
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sends email to updateUser when email is changed', async () => {
    const user = userEvent.setup();
    renderPage();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
    });
  });

  it('shows email-changed toast when email is updated', async () => {
    const user = userEvent.setup();
    renderPage();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'A confirmation link was sent to your new email address.'
      );
    });
  });

  it('does not send email to updateUser when email is unchanged', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Alex');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { first_name: 'Alex' },
      });
    });
  });

  it('sends both email and metadata when both are changed', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Alex');
    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        data: { first_name: 'Alex' },
      });
    });
  });

  it('blocks submission for invalid email format', async () => {
    const user = userEvent.setup();
    renderPage();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'not-an-email');
    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to /plans', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderPage();

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/plans' });
  });
});
