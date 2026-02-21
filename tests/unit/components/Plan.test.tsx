import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plan } from '../../../src/components/Plan';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';

function buildPlan(overrides?: Partial<PlanWithDetails>): PlanWithDetails {
  return {
    planId: 'plan-1',
    title: 'Camping Trip',
    description: 'A fun weekend outdoors',
    status: 'active',
    visibility: 'public',
    startDate: '2025-12-20T10:00:00Z',
    endDate: '2025-12-22T16:00:00Z',
    location: {
      locationId: 'loc-1',
      name: 'Yosemite',
      city: 'Mariposa',
      country: 'US',
      region: 'California',
    },
    tags: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    participants: [
      {
        participantId: 'p-1',
        planId: 'plan-1',
        name: 'Alex',
        lastName: 'Smith',
        displayName: null,
        role: 'owner',
        avatarUrl: null,
        contactEmail: null,
        contactPhone: '+1234567890',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ],
    items: [],
    ...overrides,
  };
}

describe('Plan', () => {
  it('renders plan title and description', () => {
    render(<Plan plan={buildPlan()} />);

    expect(screen.getByText('Camping Trip')).toBeInTheDocument();
    expect(screen.getByText('A fun weekend outdoors')).toBeInTheDocument();
  });

  it('renders detail labels from translations', () => {
    render(<Plan plan={buildPlan()} />);

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('shows owner name in details and participant list', () => {
    render(<Plan plan={buildPlan()} />);

    const matches = screen.getAllByText('Alex Smith');
    expect(matches).toHaveLength(2);
  });

  it('shows location details', () => {
    render(<Plan plan={buildPlan()} />);

    expect(screen.getByText('Yosemite')).toBeInTheDocument();
    expect(screen.getByText(/Mariposa/)).toBeInTheDocument();
  });

  it('shows N/A when dates are missing', () => {
    render(
      <Plan plan={buildPlan({ startDate: undefined, endDate: undefined })} />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders participant list with role badge', () => {
    render(<Plan plan={buildPlan()} />);

    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('shows empty participant message when no participants', () => {
    render(<Plan plan={buildPlan({ participants: [] })} />);

    expect(
      screen.getByText('No participants yet. Add one to get started!')
    ).toBeInTheDocument();
  });

  it('shows add participant button when handler provided', () => {
    render(<Plan plan={buildPlan()} onAddParticipant={vi.fn()} />);

    expect(screen.getByText('+ Add Participant')).toBeInTheDocument();
  });

  it('opens add participant form on button click', async () => {
    const user = userEvent.setup();
    render(<Plan plan={buildPlan()} onAddParticipant={vi.fn()} />);

    await user.click(screen.getByText('+ Add Participant'));

    expect(screen.getByText('First Name *')).toBeInTheDocument();
    expect(screen.getByText('Last Name *')).toBeInTheDocument();
    expect(screen.getByText('Phone *')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('submits add participant form and closes it', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Plan plan={buildPlan()} onAddParticipant={onAdd} />);

    await user.click(screen.getByText('+ Add Participant'));

    await user.type(screen.getByPlaceholderText('First name'), 'Bob');
    await user.type(screen.getByPlaceholderText('Last name'), 'Jones');
    await user.type(screen.getByPlaceholderText('Phone number'), '+9999999999');

    await user.click(screen.getByText('Add Participant'));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({
        name: 'Bob',
        lastName: 'Jones',
        contactPhone: '+9999999999',
        contactEmail: undefined,
      });
    });
  });

  it('cancels add participant form', async () => {
    const user = userEvent.setup();
    render(<Plan plan={buildPlan()} onAddParticipant={vi.fn()} />);

    await user.click(screen.getByText('+ Add Participant'));
    expect(screen.getByText('First Name *')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('First Name *')).not.toBeInTheDocument();
    });
  });
});
