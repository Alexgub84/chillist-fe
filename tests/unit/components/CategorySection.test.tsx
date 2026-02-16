import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategorySection from '../../../src/components/CategorySection';
import type { Item } from '../../../src/core/schemas/item';

const equipmentItems: Item[] = [
  {
    itemId: 'item-1',
    planId: 'plan-1',
    name: 'Tent',
    category: 'equipment',
    quantity: 1,
    unit: 'pcs',
    status: 'pending',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    itemId: 'item-2',
    planId: 'plan-1',
    name: 'Sleeping Bag',
    category: 'equipment',
    quantity: 2,
    unit: 'pcs',
    status: 'packed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('CategorySection', () => {
  it('renders category label and item count', () => {
    render(<CategorySection category="equipment" items={equipmentItems} />);

    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('renders item cards for each item', () => {
    render(<CategorySection category="equipment" items={equipmentItems} />);

    expect(screen.getByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('Sleeping Bag')).toBeInTheDocument();
  });

  it('shows empty state message when no items', () => {
    render(<CategorySection category="food" items={[]} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('No food items')).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });
});
