import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlansList } from '../../../src/components/PlansList';

vi.mock('@tanstack/react-router', () => ({
  Link: (props: Record<string, unknown>) => {
    const p = props as {
      to?: string;
      params?: Record<string, unknown>;
      children?: React.ReactNode;
      [k: string]: unknown;
    };
    const { to, params, children, ...rest } = p;
    let href = typeof to === 'string' ? to : '';
    if (params && typeof href === 'string') {
      Object.entries(params as Record<string, unknown>).forEach(([k, v]) => {
        href = href.replace(`$${k}`, String(v));
      });
    }

    const propsObj: Record<string, unknown> = {
      href,
      ...(rest as Record<string, unknown>),
    };

    const originalOnClick = propsObj.onClick as
      | ((e: Event) => void)
      | undefined;

    propsObj.onClick = (e: Event) => {
      try {
        if (originalOnClick) {
          originalOnClick(e as Event);
        }
      } finally {
        if (!(e as Event).defaultPrevented) {
          window.history.pushState({}, '', href);
        }
      }
    };

    return React.createElement('a', propsObj, children);
  },
}));

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

describe('PlansList', () => {
  const mixedPlans = [
    {
      planId: 'future-1',
      title: 'Future Trip',
      status: 'active' as const,
      startDate: futureDate(10),
      endDate: futureDate(12),
    },
    {
      planId: 'past-1',
      title: 'Past Camping',
      status: 'active' as const,
      startDate: pastDate(30),
      endDate: pastDate(28),
    },
    {
      planId: 'no-date',
      title: 'No Date Plan',
      status: 'draft' as const,
    },
  ];

  it('renders plans with metadata (date, location, participants)', () => {
    const mockPlans = [
      {
        planId: 'plan-1',
        title: 'Weekend Camping Trip',
        status: 'active' as const,
        location: {
          locationId: 'location-1',
          name: 'Pine Ridge Campground',
          timezone: 'America/Los_Angeles',
          latitude: 37.8651,
          longitude: -119.5383,
          country: 'USA',
          region: 'CA',
          city: 'Yosemite',
        },
        startDate: futureDate(30),
        endDate: futureDate(32),
        participantIds: ['participant-1', 'participant-2', 'participant-3'],
      },
      {
        planId: 'plan-2',
        title: 'City Weekend',
        status: 'draft' as const,
      },
    ];

    render(<PlansList plans={mockPlans} />);

    const listElement = screen.getByTestId('plans-list');
    expect(listElement).toBeInTheDocument();

    mockPlans.forEach((plan) => {
      expect(screen.getByText(plan.title)).toBeInTheDocument();
    });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();

    expect(screen.getByText(/Pine Ridge Campground/i)).toBeInTheDocument();
    expect(screen.getByText(/3 participants/i)).toBeInTheDocument();
  });

  it('renders empty state when no plans provided', () => {
    render(<PlansList plans={[]} />);

    const emptyMessage = screen.getByText(
      /no plans yet\. create one to get started!/i
    );
    expect(emptyMessage).toBeInTheDocument();
  });

  it('does not show filter tabs when there are no plans', () => {
    render(<PlansList plans={[]} />);

    expect(screen.queryByTestId('time-filter-all')).not.toBeInTheDocument();
  });

  it('shows filter tabs when plans exist', () => {
    render(<PlansList plans={mixedPlans} />);

    expect(screen.getByTestId('time-filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('time-filter-upcoming')).toBeInTheDocument();
    expect(screen.getByTestId('time-filter-past')).toBeInTheDocument();
  });

  it('defaults to "Upcoming" filter showing future and no-date plans', () => {
    render(<PlansList plans={mixedPlans} />);

    expect(screen.getByTestId('time-filter-upcoming')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    const list = screen.getByTestId('plans-list');
    expect(list.children).toHaveLength(2);
    expect(screen.getByText('Future Trip')).toBeInTheDocument();
    expect(screen.getByText('No Date Plan')).toBeInTheDocument();
    expect(screen.queryByText('Past Camping')).not.toBeInTheDocument();
  });

  it('filters to upcoming plans (future + no-date)', async () => {
    const user = userEvent.setup();
    render(<PlansList plans={mixedPlans} />);

    await user.click(screen.getByTestId('time-filter-upcoming'));

    expect(screen.getByText('Future Trip')).toBeInTheDocument();
    expect(screen.getByText('No Date Plan')).toBeInTheDocument();
    expect(screen.queryByText('Past Camping')).not.toBeInTheDocument();
  });

  it('filters to past plans only', async () => {
    const user = userEvent.setup();
    render(<PlansList plans={mixedPlans} />);

    await user.click(screen.getByTestId('time-filter-past'));

    expect(screen.getByText('Past Camping')).toBeInTheDocument();
    expect(screen.queryByText('Future Trip')).not.toBeInTheDocument();
    expect(screen.queryByText('No Date Plan')).not.toBeInTheDocument();
  });

  it('shows counts on each filter tab', () => {
    render(<PlansList plans={mixedPlans} />);

    const allTab = screen.getByTestId('time-filter-all');
    const upcomingTab = screen.getByTestId('time-filter-upcoming');
    const pastTab = screen.getByTestId('time-filter-past');

    expect(allTab).toHaveTextContent('3');
    expect(upcomingTab).toHaveTextContent('2');
    expect(pastTab).toHaveTextContent('1');
  });

  it('shows contextual empty message for upcoming filter', async () => {
    const user = userEvent.setup();
    const pastOnly = [
      {
        planId: 'past-1',
        title: 'Old Trip',
        status: 'active' as const,
        startDate: pastDate(30),
      },
    ];

    render(<PlansList plans={pastOnly} />);

    await user.click(screen.getByTestId('time-filter-upcoming'));

    expect(screen.getByText(/no upcoming plans/i)).toBeInTheDocument();
  });

  it('shows contextual empty message for past filter', async () => {
    const user = userEvent.setup();
    const futureOnly = [
      {
        planId: 'future-1',
        title: 'Next Trip',
        status: 'active' as const,
        startDate: futureDate(10),
      },
    ];

    render(<PlansList plans={futureOnly} />);

    await user.click(screen.getByTestId('time-filter-past'));

    expect(screen.getByText(/no past plans/i)).toBeInTheDocument();
  });

  it('renders correct number of list items', () => {
    const plans = [
      { planId: '1', title: 'Plan 1', status: 'draft' as const },
      { planId: '2', title: 'Plan 2', status: 'active' as const },
      { planId: '3', title: 'Plan 3', status: 'archived' as const },
    ];

    render(<PlansList plans={plans} />);

    const listElement = screen.getByTestId('plans-list');
    expect(listElement.children).toHaveLength(3);
  });

  it('links each plan to the correct /plan/:planId path', async () => {
    const user = userEvent.setup();

    const plans = [
      {
        planId: 'plan-1',
        title: 'Weekend Camping Trip',
        status: 'active' as const,
      },
    ];

    render(<PlansList plans={plans} />);

    const titleNode = screen.getByText('Weekend Camping Trip');
    const anchor = titleNode.closest('a');
    expect(anchor).toBeTruthy();
    expect(anchor).toHaveAttribute('href', '/plan/plan-1');

    await user.click(anchor as Element);
    expect(window.location.pathname).toBe('/plan/plan-1');
  });
});
