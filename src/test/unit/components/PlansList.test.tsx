import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlansList } from '../../../components/PlansList';
import type { Plan } from '../../../core/types/plan';

const createPlan = (overrides: Partial<Plan> = {}): Plan => ({
  planId: 'plan-0',
  title: 'Sample Plan',
  status: 'draft',
  ownerParticipantId: 'owner-0',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('PlansList', () => {
  it('renders all plans in the list', () => {
    const plans = [
      createPlan({ planId: '1', title: 'Camping' }),
      createPlan({ planId: '2', title: 'Family Dinner' }),
      createPlan({ planId: '3', title: 'Road Trip' }),
    ];

    render(<PlansList plans={plans} />);

    const listElement = screen.getByTestId('plans-list');
    expect(listElement).toBeInTheDocument();

    plans.forEach((plan) => {
      expect(screen.getByText(plan.title)).toBeInTheDocument();
    });
  });

  it('renders empty list when no plans provided', () => {
    render(<PlansList plans={[]} />);

    const listElement = screen.getByTestId('plans-list');
    expect(listElement).toBeInTheDocument();
    expect(listElement.children).toHaveLength(0);
  });

  it('renders correct number of list items', () => {
    const plans = [
      createPlan({ planId: '1', title: 'Plan 1' }),
      createPlan({ planId: '2', title: 'Plan 2' }),
      createPlan({ planId: '3', title: 'Plan 3' }),
    ];

    render(<PlansList plans={plans} />);

    const listElement = screen.getByTestId('plans-list');
    expect(listElement.children).toHaveLength(3);
  });
});
