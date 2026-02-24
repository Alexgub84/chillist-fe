import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantFilter from '../../../src/components/ParticipantFilter';
import type { Participant } from '../../../src/core/schemas/participant';

const participants: Participant[] = [
  {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Alice',
    lastName: 'Smith',
    contactPhone: '+1234567890',
    role: 'owner',
    rsvpStatus: 'confirmed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    participantId: 'p-2',
    planId: 'plan-1',
    name: 'Bob',
    lastName: 'Jones',
    contactPhone: '+0987654321',
    role: 'participant',
    rsvpStatus: 'pending',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const counts: Record<string, number> = {
  unassigned: 2,
  'p-1': 3,
  'p-2': 1,
};

describe('ParticipantFilter', () => {
  it('renders All, Unassigned, and one button per participant', () => {
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={() => {}}
        counts={counts}
        total={6}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('shows correct counts on each button', () => {
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={() => {}}
        counts={counts}
        total={6}
      />
    );

    const allButton = screen.getByRole('button', { name: /All/i });
    expect(allButton).toHaveTextContent('6');

    const unassignedButton = screen.getByRole('button', {
      name: /Unassigned/i,
    });
    expect(unassignedButton).toHaveTextContent('2');

    const aliceButton = screen.getByRole('button', { name: /Alice Smith/i });
    expect(aliceButton).toHaveTextContent('3');

    const bobButton = screen.getByRole('button', { name: /Bob Jones/i });
    expect(bobButton).toHaveTextContent('1');
  });

  it('marks All as pressed when selected is null', () => {
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={() => {}}
        counts={counts}
        total={6}
      />
    );

    expect(screen.getByRole('button', { name: /All/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /Unassigned/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(
      screen.getByRole('button', { name: /Alice Smith/i })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks Unassigned as pressed when selected is "unassigned"', () => {
    render(
      <ParticipantFilter
        participants={participants}
        selected="unassigned"
        onChange={() => {}}
        counts={counts}
        total={6}
      />
    );

    expect(screen.getByRole('button', { name: /All/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: /Unassigned/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('marks participant button as pressed when selected matches', () => {
    render(
      <ParticipantFilter
        participants={participants}
        selected="p-2"
        onChange={() => {}}
        counts={counts}
        total={6}
      />
    );

    expect(screen.getByRole('button', { name: /Bob Jones/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /All/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('calls onChange with null when All is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ParticipantFilter
        participants={participants}
        selected="p-1"
        onChange={onChange}
        counts={counts}
        total={6}
      />
    );

    await user.click(screen.getByRole('button', { name: /All/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with "unassigned" when Unassigned is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={onChange}
        counts={counts}
        total={6}
      />
    );

    await user.click(screen.getByRole('button', { name: /Unassigned/i }));
    expect(onChange).toHaveBeenCalledWith('unassigned');
  });

  it('calls onChange with participant id when a participant is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={onChange}
        counts={counts}
        total={6}
      />
    );

    await user.click(screen.getByRole('button', { name: /Alice Smith/i }));
    expect(onChange).toHaveBeenCalledWith('p-1');
  });

  it('shows zero count when participant has no items', () => {
    const emptyCounts: Record<string, number> = {
      unassigned: 0,
      'p-1': 0,
      'p-2': 0,
    };
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={() => {}}
        counts={emptyCounts}
        total={0}
      />
    );

    const aliceButton = screen.getByRole('button', { name: /Alice Smith/i });
    expect(aliceButton).toHaveTextContent('0');
  });

  it('has the correct aria-label on the group', () => {
    render(
      <ParticipantFilter
        participants={participants}
        selected={null}
        onChange={() => {}}
        counts={counts}
        total={6}
      />
    );

    expect(
      screen.getByRole('group', { name: 'Filter by participant' })
    ).toBeInTheDocument();
  });
});
