import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ItemCard from '../../../src/components/ItemCard';
import type { Item } from '../../../src/core/schemas/item';

const baseItem: Item = {
  itemId: 'item-1',
  planId: 'plan-1',
  name: 'Tent',
  category: 'equipment',
  quantity: 2,
  unit: 'pcs',
  status: 'pending',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const noop = vi.fn();

describe('ItemCard', () => {
  it('renders item name, quantity, and unit', () => {
    render(<ItemCard item={baseItem} />);

    expect(screen.getByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('2 Pieces')).toBeInTheDocument();
  });

  it('renders the correct status badge', () => {
    render(<ItemCard item={baseItem} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('applies line-through styling for canceled items', () => {
    const canceledItem: Item = {
      ...baseItem,
      status: 'canceled',
    };
    render(<ItemCard item={canceledItem} />);

    const nameEl = screen.getByText('Tent');
    expect(nameEl).toHaveClass('line-through');
  });

  it('renders notes when present', () => {
    const itemWithNotes: Item = {
      ...baseItem,
      notes: 'Bring extra stakes',
    };
    render(<ItemCard item={itemWithNotes} />);

    expect(screen.getByText('Bring extra stakes')).toBeInTheDocument();
  });

  it('does not render notes when absent', () => {
    render(<ItemCard item={baseItem} />);

    expect(screen.queryByText('Bring extra stakes')).not.toBeInTheDocument();
  });

  describe('permission gating (canEdit)', () => {
    it('shows edit button and inline controls when canEdit is true', () => {
      render(
        <ItemCard item={baseItem} canEdit onEdit={noop} onUpdate={noop} />
      );

      expect(
        screen.getByRole('button', { name: /Edit Tent/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel Tent/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Change status for Tent/i })
      ).toBeInTheDocument();
    });

    it('hides edit button, cancel, and inline controls when canEdit is false', () => {
      render(
        <ItemCard
          item={baseItem}
          canEdit={false}
          onEdit={noop}
          onUpdate={noop}
        />
      );

      expect(
        screen.queryByRole('button', { name: /Edit Tent/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Cancel Tent/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Change status for Tent/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('2 Pieces')).toBeInTheDocument();
    });

    it('still renders self-assign button when canEdit is false but selfAssignParticipantId is set', () => {
      render(
        <ItemCard
          item={baseItem}
          canEdit={false}
          selfAssignParticipantId="p-me"
          onUpdate={noop}
        />
      );

      expect(screen.getByText('Assign to me')).toBeInTheDocument();
    });

    it('shows "Assigned to me" badge when item is assigned to self and canEdit is false', () => {
      const assignedItem: Item = {
        ...baseItem,
        assignedParticipantId: 'p-me',
      };
      render(
        <ItemCard
          item={assignedItem}
          canEdit={false}
          selfAssignParticipantId="p-me"
          onUpdate={noop}
        />
      );

      expect(screen.getByText('Me')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Unassign Tent/i })
      ).toBeInTheDocument();
    });

    it('does not show checklist checkbox when canEdit is false in buying filter', () => {
      render(
        <ItemCard
          item={baseItem}
          canEdit={false}
          listFilter="buying"
          onUpdate={noop}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(screen.getByText('Tent')).toBeInTheDocument();
    });

    it('shows checklist checkbox when canEdit is true in buying filter', () => {
      render(
        <ItemCard item={baseItem} canEdit listFilter="buying" onUpdate={noop} />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });
});
