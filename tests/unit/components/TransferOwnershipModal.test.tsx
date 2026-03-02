import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransferOwnershipModal from '../../../src/components/TransferOwnershipModal';

describe('TransferOwnershipModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    participantName: 'Jane Smith',
    isPending: false,
  };

  it('renders title and participant name in message', () => {
    render(<TransferOwnershipModal {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: /owner/i })).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<TransferOwnershipModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmBtn = screen.getByTestId('transfer-ownership-confirm');
    await userEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(<TransferOwnershipModal {...defaultProps} onClose={onClose} />);

    const buttons = screen.getAllByRole('button');
    const cancelBtn = buttons.find(
      (btn) => btn.getAttribute('data-testid') !== 'transfer-ownership-confirm'
    )!;
    await userEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('disables buttons when isPending is true', () => {
    render(<TransferOwnershipModal {...defaultProps} isPending={true} />);

    const confirmBtn = screen.getByTestId('transfer-ownership-confirm');
    expect(confirmBtn).toBeDisabled();
  });

  it('does not render when open is false', () => {
    render(<TransferOwnershipModal {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
