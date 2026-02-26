import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanParticipants } from '../../../src/components/PlanParticipants';
import type { Participant } from '../../../src/core/schemas/participant';

function buildParticipant(overrides?: Partial<Participant>): Participant {
  return {
    participantId: 'p-1',
    planId: 'plan-1',
    userId: null,
    name: 'Alice',
    lastName: 'Owner',
    contactPhone: '555-0001',
    displayName: null,
    role: 'owner',
    avatarUrl: null,
    contactEmail: null,
    inviteToken: null,
    rsvpStatus: 'confirmed',
    lastActivityAt: null,
    adultsCount: null,
    kidsCount: null,
    foodPreferences: null,
    allergies: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PlanParticipants', () => {
  it('renders participant count and avatars', () => {
    const participants = [
      buildParticipant({ participantId: 'p-1', name: 'Alice' }),
      buildParticipant({
        participantId: 'p-2',
        name: 'Bob',
        role: 'participant',
      }),
    ];
    render(
      <PlanParticipants participants={participants} onManageClick={vi.fn()} />
    );

    expect(screen.getByText(/Participants \(2\)/)).toBeInTheDocument();
    expect(screen.getByTitle('Alice Owner')).toBeInTheDocument();
    expect(screen.getByTitle('Bob Owner')).toBeInTheDocument();
  });

  it('shows Manage button when isOwner is true', async () => {
    const onManageClick = vi.fn();
    render(
      <PlanParticipants
        participants={[buildParticipant()]}
        isOwner={true}
        onManageClick={onManageClick}
      />
    );

    const manageBtn = screen.getByText(/manage/i);
    expect(manageBtn).toBeVisible();
    await userEvent.click(manageBtn);
    expect(onManageClick).toHaveBeenCalledTimes(1);
  });

  it('hides Manage button when isOwner is false', () => {
    render(
      <PlanParticipants
        participants={[buildParticipant()]}
        isOwner={false}
        onManageClick={vi.fn()}
      />
    );
    expect(screen.queryByText(/manage/i)).not.toBeInTheDocument();
  });

  it('shows add button when onAddClick is provided', async () => {
    const onAddClick = vi.fn();
    render(
      <PlanParticipants
        participants={[buildParticipant()]}
        onManageClick={vi.fn()}
        onAddClick={onAddClick}
      />
    );

    const addBtn = screen.getByRole('button', { name: '+' });
    expect(addBtn).toBeVisible();
    await userEvent.click(addBtn);
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('hides add button when onAddClick is undefined', () => {
    render(
      <PlanParticipants
        participants={[buildParticipant()]}
        onManageClick={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
  });
});
