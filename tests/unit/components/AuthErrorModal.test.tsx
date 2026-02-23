import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import AuthErrorModal from '../../../src/components/AuthErrorModal';

describe('AuthErrorModal', () => {
  it('renders nothing when closed', () => {
    render(<AuthErrorModal open={false} onDismiss={vi.fn()} />);
    expect(screen.queryByText('Session Expired')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(<AuthErrorModal open={true} onDismiss={vi.fn()} />);
    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(
      screen.getByText(/Your session has expired or is invalid/)
    ).toBeInTheDocument();
  });

  it('calls onDismiss when Dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<AuthErrorModal open={true} onDismiss={onDismiss} />);

    await user.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('navigates to /sign-in and dismisses when Sign In is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<AuthErrorModal open={true} onDismiss={onDismiss} />);

    await user.click(screen.getByText('Sign In'));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/sign-in' });
  });
});
