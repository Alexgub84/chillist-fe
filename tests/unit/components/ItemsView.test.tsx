import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemsView, {
  type ItemsViewProps,
} from '../../../src/components/ItemsView';
import type { Item } from '../../../src/core/schemas/item';
import type { Participant } from '../../../src/core/schemas/participant';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
  }) => (
    <a href={to} data-params={JSON.stringify(params)} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const PLAN_ID = 'plan-123';

const mockItems: Item[] = [
  {
    itemId: 'item-1',
    planId: PLAN_ID,
    name: 'Tent',
    category: 'equipment',
    quantity: 1,
    unit: 'pcs',
    isAllParticipants: false,
    assignmentStatusList: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    itemId: 'item-2',
    planId: PLAN_ID,
    name: 'Water',
    category: 'food',
    quantity: 5,
    unit: 'l',
    isAllParticipants: false,
    assignmentStatusList: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const mockParticipants: Participant[] = [
  {
    participantId: 'p-1',
    planId: PLAN_ID,
    name: 'Alex',
    lastName: 'G',
    contactPhone: '123',
    role: 'owner',
    rsvpStatus: 'confirmed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const defaultProps: ItemsViewProps = {
  planId: PLAN_ID,
  planTitle: 'Camping Trip',
  items: mockItems,
  participants: mockParticipants,
  isGuest: false,
  backLink: { kind: 'plan', planId: PLAN_ID },
  onCreateItem: vi.fn(),
  onUpdateItem: vi.fn(),
};

describe('ItemsView', () => {
  it('renders plan title and item count', () => {
    render(<ItemsView {...defaultProps} />);

    expect(screen.getByText(/Camping Trip/)).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('renders items grouped by category', () => {
    render(<ItemsView {...defaultProps} />);

    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<ItemsView {...defaultProps} items={[]} />);

    expect(
      screen.getByText('No items yet. Add one to get started!')
    ).toBeInTheDocument();
  });

  it('renders back link to plan page in auth mode', () => {
    render(<ItemsView {...defaultProps} />);

    const backLink = screen.getByText('← Back to plan');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/plan/$planId');
  });

  it('renders back link to invite page in guest mode', () => {
    render(
      <ItemsView
        {...defaultProps}
        isGuest
        backLink={{
          kind: 'invite',
          planId: PLAN_ID,
          inviteToken: 'test-token-abc',
        }}
      />
    );

    const backLink = screen.getByText('← Back to plan');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute(
      'href',
      '/invite/$planId/$inviteToken'
    );
  });

  it('renders speed-dial trigger button', () => {
    render(<ItemsView {...defaultProps} />);

    expect(screen.getByTestId('speed-dial-trigger')).toBeInTheDocument();
  });

  it('opens add item modal when FAB speed-dial action is clicked', async () => {
    const user = userEvent.setup();
    render(<ItemsView {...defaultProps} />);

    await user.click(screen.getByTestId('speed-dial-trigger'));
    await user.click(screen.getByTestId('add-item-fab'));

    expect(
      screen.getByText('Add Item', { selector: 'h2' })
    ).toBeInTheDocument();
  });

  it('renders list filter tabs when items exist', () => {
    render(<ItemsView {...defaultProps} />);

    expect(screen.getByText(/Buying List/i)).toBeInTheDocument();
    expect(screen.getByText(/Packing List/i)).toBeInTheDocument();
  });

  it('excludes canceled items from Participant filter total', () => {
    const itemsWithCanceled: Item[] = [
      ...mockItems,
      {
        itemId: 'item-canceled',
        planId: PLAN_ID,
        name: 'Canceled Item',
        category: 'food',
        quantity: 1,
        unit: 'pcs',
        isAllParticipants: false,
        assignmentStatusList: [{ participantId: 'p-1', status: 'canceled' }],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    render(
      <ItemsView
        {...defaultProps}
        items={itemsWithCanceled}
        participants={mockParticipants}
      />
    );

    const allButton = screen.getByRole('button', { name: /All/i });
    expect(allButton).toHaveTextContent('2');
  });

  it('does not render list filter tabs when no items', () => {
    render(<ItemsView {...defaultProps} items={[]} />);

    expect(screen.queryByText(/Buying List/i)).not.toBeInTheDocument();
  });

  describe('guest mode', () => {
    const guestProps: ItemsViewProps = {
      ...defaultProps,
      isGuest: true,
      guestParticipantId: 'p-guest',
      backLink: {
        kind: 'invite',
        planId: PLAN_ID,
        inviteToken: 'invite-token',
      },
    };

    it('does not pass participants to ItemForm in guest mode', async () => {
      const guestItems: Item[] = [
        {
          itemId: 'item-guest',
          planId: PLAN_ID,
          name: 'Chips',
          category: 'food',
          quantity: 2,
          unit: 'pack',
          isAllParticipants: false,
          assignmentStatusList: [
            { participantId: 'p-guest', status: 'pending' },
          ],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const user = userEvent.setup();
      render(<ItemsView {...guestProps} items={guestItems} />);

      await user.click(screen.getByRole('button', { name: /Add Item/i }));

      expect(screen.queryByText(/Assign to/i)).not.toBeInTheDocument();
    });
  });

  describe('assign-all items and participant filter', () => {
    const twoParticipants: Participant[] = [
      {
        participantId: 'p-1',
        planId: PLAN_ID,
        name: 'Alex',
        lastName: 'G',
        contactPhone: '123',
        role: 'owner',
        rsvpStatus: 'confirmed',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        participantId: 'p-2',
        planId: PLAN_ID,
        name: 'Bob',
        lastName: 'H',
        contactPhone: '456',
        role: 'participant',
        rsvpStatus: 'confirmed',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const allAssignedItem: Item = {
      itemId: 'item-all',
      planId: PLAN_ID,
      name: 'Sunscreen',
      category: 'equipment',
      quantity: 1,
      unit: 'pcs',
      isAllParticipants: true,
      assignmentStatusList: [
        { participantId: 'p-1', status: 'pending' },
        { participantId: 'p-2', status: 'pending' },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    it('shows assign-all item under each participant filter', async () => {
      const user = userEvent.setup();
      render(
        <ItemsView
          {...defaultProps}
          items={[allAssignedItem]}
          participants={twoParticipants}
        />
      );

      expect(screen.getByText('Sunscreen')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Alex G/i }));
      expect(screen.getByText('Sunscreen')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Bob H/i }));
      expect(screen.getByText('Sunscreen')).toBeInTheDocument();
    });

    it('shows participant count including assign-all items', () => {
      render(
        <ItemsView
          {...defaultProps}
          items={[allAssignedItem]}
          participants={twoParticipants}
        />
      );

      const alexBtn = screen.getByRole('button', { name: /Alex G/i });
      const bobBtn = screen.getByRole('button', { name: /Bob H/i });
      expect(alexBtn).toHaveTextContent('1');
      expect(bobBtn).toHaveTextContent('1');
    });

    it('calls onUpdateItem with status change on assign-all item', async () => {
      const onUpdateItem = vi.fn();
      const user = userEvent.setup();
      render(
        <ItemsView
          {...defaultProps}
          items={[allAssignedItem]}
          participants={twoParticipants}
          selfParticipantId="p-1"
          onUpdateItem={onUpdateItem}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /Change status for Sunscreen/i })
      );
      await user.click(screen.getByRole('option', { name: /Purchased/i }));

      expect(onUpdateItem).toHaveBeenCalledWith('item-all', {
        assignmentStatusList: [
          { participantId: 'p-1', status: 'purchased' },
          { participantId: 'p-2', status: 'pending' },
        ],
      });
    });
  });

  describe('non-owner permission gating', () => {
    const assignedItem: Item = {
      itemId: 'item-assigned',
      planId: PLAN_ID,
      name: 'Flashlight',
      category: 'equipment',
      quantity: 1,
      unit: 'pcs',
      isAllParticipants: false,
      assignmentStatusList: [{ participantId: 'p-me', status: 'pending' }],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const otherItem: Item = {
      itemId: 'item-other',
      planId: PLAN_ID,
      name: 'Cooler',
      category: 'equipment',
      quantity: 1,
      unit: 'pcs',
      isAllParticipants: false,
      assignmentStatusList: [{ participantId: 'p-other', status: 'pending' }],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    it('shows edit button for items assigned to current participant', () => {
      render(
        <ItemsView
          {...defaultProps}
          items={[assignedItem]}
          selfParticipantId="p-me"
        />
      );

      expect(
        screen.getByRole('button', { name: /Edit Flashlight/i })
      ).toBeInTheDocument();
    });

    it('hides edit button for items assigned to other participants', () => {
      render(
        <ItemsView
          {...defaultProps}
          items={[otherItem]}
          selfParticipantId="p-me"
        />
      );

      expect(
        screen.queryByRole('button', { name: /Edit Cooler/i })
      ).not.toBeInTheDocument();
    });

    it('shows all edit buttons when selfParticipantId is not set (owner)', () => {
      render(<ItemsView {...defaultProps} items={[assignedItem, otherItem]} />);

      expect(
        screen.getByRole('button', { name: /Edit Flashlight/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Edit Cooler/i })
      ).toBeInTheDocument();
    });
  });
});
