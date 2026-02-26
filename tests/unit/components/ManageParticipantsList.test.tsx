import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageParticipantsList } from '../../../src/components/ManageParticipantsList';
import type { Participant } from '../../../src/core/schemas/participant';

vi.mock('../../../src/core/invite', () => ({
  copyInviteLink: vi.fn().mockResolvedValue(true),
  shareInviteLink: vi.fn().mockResolvedValue('copied'),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

function buildParticipant(overrides?: Partial<Participant>): Participant {
  return {
    participantId: 'p-1',
    planId: 'plan-1',
    userId: null,
    name: 'Alex',
    lastName: 'Smith',
    contactPhone: '+1234567890',
    displayName: null,
    role: 'participant',
    avatarUrl: null,
    contactEmail: null,
    inviteToken: 'token-123',
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

describe('ManageParticipantsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when participants is empty', () => {
    const { container } = render(
      <ManageParticipantsList
        participants={[]}
        planId="plan-1"
        planTitle="Test Plan"
        isOwner={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders participant names and role badge', () => {
    render(
      <ManageParticipantsList
        participants={[buildParticipant()]}
        planId="plan-1"
        planTitle="Test Plan"
        isOwner={false}
      />
    );

    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.getByText(/participant/i)).toBeInTheDocument();
  });

  it('renders contact phone when present', () => {
    render(
      <ManageParticipantsList
        participants={[buildParticipant({ contactPhone: '555-1234' })]}
        planId="plan-1"
        planTitle="Test Plan"
        isOwner={false}
      />
    );

    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('shows RSVP badge for non-owner participants when isOwner is true', () => {
    render(
      <ManageParticipantsList
        participants={[
          buildParticipant({ role: 'participant', rsvpStatus: 'confirmed' }),
        ]}
        planId="plan-1"
        planTitle="Test Plan"
        isOwner={true}
      />
    );

    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it('shows copy and share buttons for non-owner with invite token', async () => {
    const { copyInviteLink } = await import('../../../src/core/invite');
    const user = userEvent.setup();

    render(
      <ManageParticipantsList
        participants={[buildParticipant({ inviteToken: 'tok' })]}
        planId="plan-1"
        planTitle="Test Plan"
        isOwner={true}
      />
    );

    const copyButton = screen.getByTitle(/copy invite link/i);
    await user.click(copyButton);

    expect(copyInviteLink).toHaveBeenCalledWith('plan-1', 'tok');
  });

  it('renders multiple participants', () => {
    render(
      <ManageParticipantsList
        participants={[
          buildParticipant({ participantId: 'p-1', name: 'Alice' }),
          buildParticipant({
            participantId: 'p-2',
            name: 'Bob',
            lastName: 'Brown',
            role: 'viewer',
          }),
        ]}
        planId="plan-1"
        planTitle="Test Plan"
        isOwner={false}
      />
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Brown')).toBeInTheDocument();
  });
});
