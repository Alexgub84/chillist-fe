import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plan } from '../../../src/components/Plan';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';

vi.mock('../../../src/contexts/useAuth', () => ({
  useAuth: () => ({
    session: null,
    user: null,
    loading: false,
    isAdmin: false,
    signOut: vi.fn(),
  }),
}));

function buildTestPlan(overrides?: Partial<PlanWithDetails>): PlanWithDetails {
  return {
    planId: 'plan-1',
    title: 'Test Plan',
    description: 'A test plan',
    status: 'active',
    visibility: 'private',
    ownerParticipantId: 'p-1',
    startDate: '2026-07-10T09:00:00Z',
    endDate: '2026-07-12T18:00:00Z',
    tags: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    items: [],
    participants: [
      {
        participantId: 'p-1',
        planId: 'plan-1',
        userId: 'user-1',
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
      },
    ],
    ...overrides,
  };
}

describe('Plan - Edit Button', () => {
  let handleEdit: ReturnType<typeof vi.fn>;
  let handleDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    handleEdit = vi.fn();
    handleDelete = vi.fn();
  });

  it('shows edit button when isOwner is true and onEdit is provided', () => {
    render(
      <Plan
        plan={buildTestPlan()}
        isOwner={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByTestId('edit-plan-button')).toBeVisible();
  });

  it('hides edit button when isOwner is false', () => {
    render(
      <Plan
        plan={buildTestPlan()}
        isOwner={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    expect(screen.queryByTestId('edit-plan-button')).not.toBeInTheDocument();
  });

  it('hides edit button when onEdit is not provided', () => {
    render(
      <Plan plan={buildTestPlan()} isOwner={true} onDelete={handleDelete} />
    );

    expect(screen.queryByTestId('edit-plan-button')).not.toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Plan
        plan={buildTestPlan()}
        isOwner={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    await user.click(screen.getByTestId('edit-plan-button'));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('shows delete button alongside edit button for owner', () => {
    render(
      <Plan
        plan={buildTestPlan()}
        isOwner={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByTestId('edit-plan-button')).toBeVisible();
    expect(screen.getByText(/delete plan/i)).toBeVisible();
  });

  it('hides both edit and delete when isOwner is false', () => {
    render(
      <Plan
        plan={buildTestPlan()}
        isOwner={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    expect(screen.queryByTestId('edit-plan-button')).not.toBeInTheDocument();
    expect(screen.queryByText(/delete plan/i)).not.toBeInTheDocument();
  });
});
