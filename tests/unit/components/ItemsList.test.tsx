import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import ItemsList from '../../../src/components/ItemsList';
import type { Item } from '../../../src/core/schemas/item';
import type { Participant } from '../../../src/core/schemas/participant';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const equipmentItem: Item = {
  itemId: 'item-1',
  planId: 'plan-1',
  name: 'Tent',
  category: 'equipment',
  quantity: 1,
  unit: 'pcs',
  status: 'pending',
  subcategory: 'Venue Setup and Layout',
  assignedParticipantId: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const foodItem: Item = {
  itemId: 'item-2',
  planId: 'plan-1',
  name: 'Bananas',
  category: 'food',
  quantity: 2,
  unit: 'pcs',
  status: 'pending',
  subcategory: 'Fresh Fruit',
  assignedParticipantId: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('ItemsList', () => {
  it('renders equipment and food sections', () => {
    render(
      <ItemsList
        items={[equipmentItem, foodItem]}
        participants={[]}
        groupBySubcategory={false}
      />
    );

    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('Bananas')).toBeInTheDocument();
  });

  it('renders subcategory headers when groupBySubcategory is true', () => {
    render(
      <ItemsList
        items={[equipmentItem, foodItem]}
        participants={[]}
        groupBySubcategory
      />
    );

    expect(screen.getByText('Venue Setup and Layout')).toBeInTheDocument();
    expect(screen.getByText('Fresh Fruit')).toBeInTheDocument();
    expect(screen.getByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('Bananas')).toBeInTheDocument();
  });

  it('shows empty category message when category has no items', () => {
    render(
      <ItemsList
        items={[foodItem]}
        participants={[]}
        groupBySubcategory={false}
      />
    );

    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('No equipment items')).toBeInTheDocument();
    expect(screen.getByText('Bananas')).toBeInTheDocument();
  });

  it('renders bulk assign button per subcategory when onBulkAssign is provided with participants and items', () => {
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
    ];

    render(
      <ItemsList
        items={[equipmentItem, foodItem]}
        participants={participants}
        onBulkAssign={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button', { name: /assign all/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render bulk assign buttons when onBulkAssign is not provided', () => {
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
    ];

    render(
      <ItemsList
        items={[equipmentItem, foodItem]}
        participants={participants}
      />
    );

    expect(
      screen.queryAllByRole('button', { name: /assign all/i })
    ).toHaveLength(0);
  });
});
