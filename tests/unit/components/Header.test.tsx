import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../src/contexts/useAuth');

import { useAuth } from '../../../src/contexts/useAuth';
import Header from '../../../src/components/Header';

const mockUseAuth = vi.mocked(useAuth);

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: () => void;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function authUser(overrides?: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  return {
    session: {} as never,
    user: {
      email: overrides?.email ?? 'test@chillist.dev',
      user_metadata: overrides?.user_metadata ?? {},
    } as never,
    loading: false,
    signOut: vi.fn(),
  };
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated', () => {
    it('shows Sign In and Sign Up links', () => {
      mockUseAuth.mockReturnValue({
        session: null,
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('hides auth UI while loading', () => {
      mockUseAuth.mockReturnValue({
        session: null,
        user: null,
        loading: true,
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    it('Sign In link points to /signin', () => {
      mockUseAuth.mockReturnValue({
        session: null,
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      render(<Header />);
      expect(screen.getByText('Sign In').closest('a')).toHaveAttribute(
        'href',
        '/signin'
      );
    });

    it('Sign Up link points to /signup', () => {
      mockUseAuth.mockReturnValue({
        session: null,
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      render(<Header />);
      expect(screen.getByText('Sign Up').closest('a')).toHaveAttribute(
        'href',
        '/signup'
      );
    });
  });

  describe('authenticated - avatar button', () => {
    it('shows initials from first_name + last_name', () => {
      mockUseAuth.mockReturnValue(
        authUser({
          user_metadata: { first_name: 'Alex', last_name: 'Guberman' },
        })
      );

      render(<Header />);
      expect(screen.getByText('AG')).toBeInTheDocument();
    });

    it('shows initials from full_name when no first/last', () => {
      mockUseAuth.mockReturnValue(
        authUser({ user_metadata: { full_name: 'Jane Doe' } })
      );

      render(<Header />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows first letter of email when no metadata', () => {
      mockUseAuth.mockReturnValue(authUser({ email: 'test@chillist.dev' }));

      render(<Header />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('does not show Sign In or Sign Up when authenticated', () => {
      mockUseAuth.mockReturnValue(authUser());

      render(<Header />);

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });
  });

  describe('authenticated - user dropdown', () => {
    it('opens dropdown on avatar click showing user details', async () => {
      mockUseAuth.mockReturnValue(
        authUser({
          email: 'alex@chillist.dev',
          user_metadata: {
            first_name: 'Alex',
            last_name: 'Guberman',
            phone: '+972501234567',
          },
        })
      );

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));

      expect(screen.getByTestId('menu-display-name')).toHaveTextContent('Alex');
      expect(screen.getByTestId('menu-email')).toHaveTextContent(
        'alex@chillist.dev'
      );
      expect(screen.getByTestId('menu-phone')).toHaveTextContent(
        '+972501234567'
      );
    });

    it('hides phone when not set in metadata', async () => {
      mockUseAuth.mockReturnValue(authUser({ email: 'no-phone@test.com' }));

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));

      expect(screen.getByTestId('menu-email')).toHaveTextContent(
        'no-phone@test.com'
      );
      expect(screen.queryByTestId('menu-phone')).not.toBeInTheDocument();
    });

    it('shows Edit Profile link pointing to /complete-profile', async () => {
      mockUseAuth.mockReturnValue(authUser());

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));

      const editLink = screen.getByText('Edit Profile');
      expect(editLink.closest('a')).toHaveAttribute(
        'href',
        '/complete-profile'
      );
    });

    it('shows Sign Out option in dropdown', async () => {
      mockUseAuth.mockReturnValue(authUser());

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('calls signOut when Sign Out is clicked in dropdown', async () => {
      const signOutFn = vi.fn();
      mockUseAuth.mockReturnValue({
        ...authUser(),
        signOut: signOutFn,
      });

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));
      await user.click(screen.getByText('Sign Out'));

      expect(signOutFn).toHaveBeenCalledOnce();
    });

    it('closes dropdown after clicking Sign Out', async () => {
      mockUseAuth.mockReturnValue(authUser());

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));
      expect(screen.getByTestId('menu-email')).toBeInTheDocument();

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.queryByTestId('menu-email')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      mockUseAuth.mockReturnValue(authUser());

      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByLabelText('User menu'));
      expect(screen.getByTestId('menu-email')).toBeInTheDocument();

      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByTestId('menu-email')).not.toBeInTheDocument();
      });
    });
  });

  describe('authenticated - state transitions', () => {
    it('shows Sign In and Sign Up after sign-out re-render', () => {
      mockUseAuth.mockReturnValueOnce(authUser());

      const { rerender } = render(<Header />);
      expect(screen.getByLabelText('User menu')).toBeInTheDocument();

      mockUseAuth.mockReturnValueOnce({
        session: null,
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      rerender(<Header />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });
  });
});
