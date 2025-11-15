import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlansList } from '../../../components/PlansList';

describe.skip('PlansList', () => {
  // Skips all tests in this describe block
  it('renders all plans in the list', () => {
    const plans = [
      { planId: '1', title: 'Camping' },
      { planId: '2', title: 'Family Dinner' },
      { planId: '3', title: 'Road Trip' },
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
      { planId: '1', title: 'Plan 1' },
      { planId: '2', title: 'Plan 2' },
      { planId: '3', title: 'Plan 3' },
    ];

    render(<PlansList plans={plans} />);

    const listElement = screen.getByTestId('plans-list');
    expect(listElement.children).toHaveLength(3);
  });
});
