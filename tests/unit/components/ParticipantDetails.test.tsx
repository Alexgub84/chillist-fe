import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantDetails from '../../../src/components/ParticipantDetails';
import type { Participant } from '../../../src/core/schemas/participant';

function buildParticipant(overrides?: Partial<Participant>): Participant {
  return {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Alex',
    lastName: 'Smith',
    contactPhone: '+1234567890',
    displayName: null,
    role: 'owner',
    avatarUrl: null,
    contactEmail: null,
    rsvpStatus: 'pending',
    lastActivityAt: null,
    adultsCount: null,
    kidsCount: null,
    foodPreferences: null,
    allergies: null,
    notes: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ParticipantDetails', () => {
  it('renders nothing when participants list is empty', () => {
    const { container } = render(
      <ParticipantDetails participants={[]} planId="plan-1" planTitle="Test" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders section title with participant count', () => {
    render(
      <ParticipantDetails
        participants={[
          buildParticipant(),
          buildParticipant({
            participantId: 'p-2',
            name: 'Jane',
            role: 'participant',
          }),
        ]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(
      screen.getByText((_content, el) => el?.textContent === 'Group Details(2)')
    ).toBeInTheDocument();
  });

  it('renders participant name and role badge', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant()]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('shows "not filled" when participant has no preferences', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant()]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('Preferences not filled yet')).toBeInTheDocument();
  });

  it('shows people count when adultsCount is filled', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant({ adultsCount: 2 })]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('2 adults')).toBeInTheDocument();
    expect(
      screen.queryByText('Preferences not filled yet')
    ).not.toBeInTheDocument();
  });

  it('shows people count with both adults and kids', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant({ adultsCount: 2, kidsCount: 3 })]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('2 adults, 3 kids')).toBeInTheDocument();
  });

  it('shows food preferences and allergies', () => {
    render(
      <ParticipantDetails
        participants={[
          buildParticipant({
            foodPreferences: 'vegetarian',
            allergies: 'nuts',
          }),
        ]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('vegetarian · nuts')).toBeInTheDocument();
  });

  it('shows notes when filled', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant({ notes: 'bring extra tent' })]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('bring extra tent')).toBeInTheDocument();
  });

  it('shows edit button when onEditPreferences is provided', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant()]}
        planId="plan-1"
        planTitle="Test"
        onEditPreferences={vi.fn()}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('does not show edit button when onEditPreferences is not provided', () => {
    render(
      <ParticipantDetails
        participants={[buildParticipant()]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('calls onEditPreferences with participantId when edit is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ParticipantDetails
        participants={[buildParticipant({ participantId: 'p-42' })]}
        planId="plan-1"
        planTitle="Test"
        onEditPreferences={onEdit}
      />
    );

    await user.click(screen.getByText('Edit'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith('p-42');
  });

  it('renders multiple participant cards', () => {
    render(
      <ParticipantDetails
        participants={[
          buildParticipant({ participantId: 'p-1', name: 'Alex' }),
          buildParticipant({
            participantId: 'p-2',
            name: 'Jane',
            lastName: 'Doe',
            role: 'participant',
            adultsCount: 1,
            foodPreferences: 'vegan',
          }),
        ]}
        planId="plan-1"
        planTitle="Test"
      />
    );

    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Preferences not filled yet')).toBeInTheDocument();
    expect(screen.getByText('vegan')).toBeInTheDocument();
  });
});
