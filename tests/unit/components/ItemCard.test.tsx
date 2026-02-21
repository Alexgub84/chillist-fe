import { describe, it, expect } from 'vitest';
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
});
