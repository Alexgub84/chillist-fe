import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkAssignButton from '../../../src/components/BulkAssignButton';
import type { Item } from '../../../src/core/schemas/item';
import type { Participant } from '../../../src/core/schemas/participant';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const participants: Participant[] = [
  {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Alex',
    lastName: 'Smith',
    contactPhone: '',
    role: 'owner',
    rsvpStatus: 'confirmed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    participantId: 'p-2',
    planId: 'plan-1',
    name: 'Jane',
    lastName: 'Doe',
    contactPhone: '',
    role: 'participant',
    rsvpStatus: 'confirmed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

function buildItem(overrides: Partial<Item> = {}): Item {
  return {
    itemId: 'item-1',
    planId: 'plan-1',
    name: 'Tent',
    category: 'equipment',
    quantity: 1,
    unit: 'pcs',
    status: 'pending',
    assignedParticipantId: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('BulkAssignButton', () => {
  it('renders the assign button', () => {
    render(
      <BulkAssignButton
        items={[buildItem()]}
        participants={participants}
        onAssign={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: /assign all/i })
    ).toBeInTheDocument();
  });

  it('renders nothing when participants is empty', () => {
    const { container } = render(
      <BulkAssignButton
        items={[buildItem()]}
        participants={[]}
        onAssign={vi.fn()}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('shows participant list when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BulkAssignButton
        items={[buildItem()]}
        participants={participants}
        onAssign={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));

    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('calls onAssign immediately when no conflicts', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: null }),
      buildItem({ itemId: 'i-2', assignedParticipantId: null }),
    ];

    render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={onAssign}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));
    await user.click(screen.getByText('Alex Smith'));

    expect(onAssign).toHaveBeenCalledWith(['i-1', 'i-2'], 'p-1');
  });

  it('calls onAssign immediately when all items already assigned to same participant', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: 'p-1' }),
      buildItem({ itemId: 'i-2', assignedParticipantId: 'p-1' }),
    ];

    render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={onAssign}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));
    await user.click(screen.getByText('Alex Smith'));

    expect(onAssign).toHaveBeenCalledWith(['i-1', 'i-2'], 'p-1');
  });

  it('opens conflict dialog when items are assigned to different participant', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: null }),
      buildItem({ itemId: 'i-2', assignedParticipantId: 'p-2' }),
    ];

    render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={onAssign}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));
    await user.click(screen.getByText('Alex Smith'));

    expect(onAssign).not.toHaveBeenCalled();
    expect(screen.getByText(/already assigned/i)).toBeInTheDocument();
  });

  it('assigns all items when Assign All is clicked in conflict dialog', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: null }),
      buildItem({ itemId: 'i-2', assignedParticipantId: 'p-2' }),
    ];

    render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={onAssign}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));
    await user.click(screen.getByText('Alex Smith'));
    await user.click(screen.getByRole('button', { name: /^assign all$/i }));

    expect(onAssign).toHaveBeenCalledWith(['i-1', 'i-2'], 'p-1');
  });

  it('assigns only unassigned items when Only Unassigned is clicked', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: null }),
      buildItem({ itemId: 'i-2', assignedParticipantId: 'p-2' }),
      buildItem({ itemId: 'i-3', assignedParticipantId: 'p-1' }),
    ];

    render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={onAssign}
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));
    await user.click(screen.getByText('Alex Smith'));
    await user.click(screen.getByRole('button', { name: /only unassigned/i }));

    expect(onAssign).toHaveBeenCalledWith(['i-1', 'i-3'], 'p-1');
  });

  it('with restrictToUnassignedOnly shows only self in dropdown and assigns only unassigned items', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: null }),
      buildItem({ itemId: 'i-2', assignedParticipantId: 'p-2' }),
    ];

    render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={onAssign}
        restrictToUnassignedOnly
        selfParticipantId="p-1"
      />
    );

    await user.click(screen.getByRole('button', { name: /assign all/i }));

    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();

    await user.click(screen.getByText('Alex Smith'));

    expect(onAssign).toHaveBeenCalledWith(['i-1'], 'p-1');
  });

  it('with restrictToUnassignedOnly renders nothing when no unassigned items', () => {
    const items = [
      buildItem({ itemId: 'i-1', assignedParticipantId: 'p-2' }),
      buildItem({ itemId: 'i-2', assignedParticipantId: 'p-2' }),
    ];

    const { container } = render(
      <BulkAssignButton
        items={items}
        participants={participants}
        onAssign={vi.fn()}
        restrictToUnassignedOnly
        selfParticipantId="p-1"
      />
    );

    expect(container.innerHTML).toBe('');
  });
});
