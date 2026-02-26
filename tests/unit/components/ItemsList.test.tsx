import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ItemsList from '../../../src/components/ItemsList';
import type { Item } from '../../../src/core/schemas/item';

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
});
