import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkAssignDialog from '../../../src/components/BulkAssignDialog';

const defaults = {
  open: true,
  onClose: vi.fn(),
  participantName: 'Alex Smith',
  conflictCount: 3,
  totalCount: 5,
  onAssignAll: vi.fn(),
  onOnlyUnassigned: vi.fn(),
};

describe('BulkAssignDialog', () => {
  it('renders conflict message with counts', () => {
    render(<BulkAssignDialog {...defaults} />);

    expect(screen.getByText(/3.*of.*5.*items/i)).toBeInTheDocument();
  });

  it('renders three action buttons', () => {
    render(<BulkAssignDialog {...defaults} />);

    expect(
      screen.getByRole('button', { name: /assign all/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /only unassigned/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onAssignAll and onClose when Assign All is clicked', async () => {
    const user = userEvent.setup();
    const onAssignAll = vi.fn();
    const onClose = vi.fn();
    render(
      <BulkAssignDialog
        {...defaults}
        onAssignAll={onAssignAll}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));

    expect(onAssignAll).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onOnlyUnassigned and onClose when Only Unassigned is clicked', async () => {
    const user = userEvent.setup();
    const onOnlyUnassigned = vi.fn();
    const onClose = vi.fn();
    render(
      <BulkAssignDialog
        {...defaults}
        onOnlyUnassigned={onOnlyUnassigned}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /only unassigned/i }));

    expect(onOnlyUnassigned).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls only onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAssignAll = vi.fn();
    const onOnlyUnassigned = vi.fn();
    render(
      <BulkAssignDialog
        {...defaults}
        onClose={onClose}
        onAssignAll={onAssignAll}
        onOnlyUnassigned={onOnlyUnassigned}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onAssignAll).not.toHaveBeenCalled();
    expect(onOnlyUnassigned).not.toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    render(<BulkAssignDialog {...defaults} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
