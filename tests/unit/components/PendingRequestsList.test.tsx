import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingRequestsList } from '../../../src/components/PendingRequestsList';
import type { PendingRequestPlan } from '../../../src/core/schemas/plan';

describe('PendingRequestsList', () => {
  it('returns null when plans is empty', () => {
    const { container } = render(<PendingRequestsList plans={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders heading and list when plans exist', () => {
    const plans: PendingRequestPlan[] = [
      {
        planId: 'plan-1',
        title: 'Weekend Camping',
        startDate: '2025-06-15T00:00:00Z',
        endDate: '2025-06-17T00:00:00Z',
        location: { name: 'Big Sur' },
      },
    ];

    render(<PendingRequestsList plans={plans} />);

    expect(screen.getByText('Pending join requests')).toBeInTheDocument();
    expect(screen.getByText('Weekend Camping')).toBeInTheDocument();
    expect(screen.getByText('Pending for approval')).toBeInTheDocument();
    expect(screen.getByTestId('pending-requests-list')).toBeInTheDocument();
    expect(
      screen.getByTestId('pending-request-plan-plan-1')
    ).toBeInTheDocument();
  });

  it('renders multiple plans', () => {
    const plans: PendingRequestPlan[] = [
      {
        planId: 'plan-a',
        title: 'Trip A',
        startDate: null,
        endDate: null,
        location: null,
      },
      {
        planId: 'plan-b',
        title: 'Trip B',
        startDate: '2025-07-01T00:00:00Z',
        endDate: null,
        location: { name: 'Paris' },
      },
    ];

    render(<PendingRequestsList plans={plans} />);

    expect(screen.getByText('Trip A')).toBeInTheDocument();
    expect(screen.getByText('Trip B')).toBeInTheDocument();
  });
});
