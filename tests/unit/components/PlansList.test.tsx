import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlansList } from '../../../src/components/PlansList';

vi.mock('@tanstack/react-router', () => ({
  // Mock Link to produce a real `href` attribute from `to` + `params` so
  // tests can assert the generated path.
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

    // Create props and simulate navigation by updating history when the
    // anchor is clicked. This makes it possible to assert navigation in
    // a jsdom test environment.
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
        // If the click handler didn't call preventDefault, push a new
        // history entry so tests can observe the navigation.
        if (!(e as Event).defaultPrevented) {
          window.history.pushState({}, '', href);
        }
      }
    };

    return React.createElement('a', propsObj, children);
  },
}));

describe('PlansList', () => {
  it('renders all plans in the list', () => {
    const mockPlans = [
      {
        planId: 'plan-1',
        title: 'Weekend Camping Trip',
        description: 'Two-night stay at Pine Ridge Campground with friends.',
        status: 'active',
        visibility: 'public',
        ownerParticipantId: 'participant-1',
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
        startDate: '2025-07-18T00:00:00.000Z',
        endDate: '2025-07-20T00:00:00.000Z',
        tags: ['outdoors', 'family', 'camping'],
        participantIds: ['participant-1', 'participant-2', 'participant-3'],
        createdAt: '2025-05-01T12:00:00.000Z',
        updatedAt: '2025-05-10T08:30:00.000Z',
      },
      {
        planId: 'plan-2',
        title: 'City Weekend',
        description: 'Explore downtown and try new restaurants.',
        status: 'draft',
        visibility: 'unlisted',
        ownerParticipantId: 'participant-2',
        createdAt: '2025-06-01T09:00:00.000Z',
        updatedAt: '2025-06-02T10:15:00.000Z',
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

    expect(screen.getByText(/Jul 18, 2025/i)).toBeInTheDocument();
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
    // The mocked Link renders an <a> with an href computed from `to` and `params`.
    const anchor = titleNode.closest('a');
    expect(anchor).toBeTruthy();
    expect(anchor).toHaveAttribute('href', '/plan/plan-1');

    // Simulate a user click and assert that our Link mock pushed a history entry
    // so that the location changed to the expected path.
    await user.click(anchor as Element);
    expect(window.location.pathname).toBe('/plan/plan-1');
  });
});
