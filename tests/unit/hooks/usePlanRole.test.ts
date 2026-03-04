import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlanRole } from '../../../src/hooks/usePlanRole';
import { useAuth } from '../../../src/contexts/useAuth';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';
import type { Item } from '../../../src/core/schemas/item';

vi.mock('../../../src/contexts/useAuth', () => ({
  useAuth: vi.fn(),
}));

const ts = '2025-01-01T00:00:00Z';

function makePlan(
  participants: PlanWithDetails['participants']
): PlanWithDetails {
  return {
    planId: 'plan-1',
    title: 'Test Plan',
    status: 'active',
    visibility: 'invite_only',
    participants,
    items: [],
    createdAt: ts,
    updatedAt: ts,
  } as PlanWithDetails;
}

function makeItem(assignedTo: string | null): Item {
  return {
    itemId: 'i-1',
    planId: 'plan-1',
    name: 'Tent',
    category: 'equipment',
    quantity: 1,
    unit: 'pcs',
    status: 'pending',
    assignedParticipantId: assignedTo,
    isAllParticipants: false,
    allParticipantsGroupId: null,
    createdAt: ts,
    updatedAt: ts,
  } as Item;
}

describe('usePlanRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isOwner=true when user is plan owner', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-1' } as ReturnType<typeof useAuth>['user'],
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    const plan = makePlan([
      {
        participantId: 'p-1',
        planId: 'plan-1',
        userId: 'user-1',
        name: 'Owner',
        lastName: 'User',
        contactPhone: '',
        role: 'owner',
        rsvpStatus: 'confirmed',
        createdAt: ts,
        updatedAt: ts,
      },
    ]);

    const { result } = renderHook(() => usePlanRole(plan));

    expect(result.current.isOwner).toBe(true);
    expect(result.current.currentParticipant?.participantId).toBe('p-1');
    expect(result.current.canEditItem).toBeUndefined();
  });

  it('returns isOwner=false for a regular participant', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-2' } as ReturnType<typeof useAuth>['user'],
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    const plan = makePlan([
      {
        participantId: 'p-1',
        planId: 'plan-1',
        userId: 'user-1',
        name: 'Owner',
        lastName: 'User',
        contactPhone: '',
        role: 'owner',
        rsvpStatus: 'confirmed',
        createdAt: ts,
        updatedAt: ts,
      },
      {
        participantId: 'p-2',
        planId: 'plan-1',
        userId: 'user-2',
        name: 'Member',
        lastName: 'User',
        contactPhone: '',
        role: 'participant',
        rsvpStatus: 'confirmed',
        createdAt: ts,
        updatedAt: ts,
      },
    ]);

    const { result } = renderHook(() => usePlanRole(plan));

    expect(result.current.isOwner).toBe(false);
    expect(result.current.currentParticipant?.participantId).toBe('p-2');
  });

  it('canEditItem allows editing only items assigned to current participant', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-2' } as ReturnType<typeof useAuth>['user'],
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    const plan = makePlan([
      {
        participantId: 'p-2',
        planId: 'plan-1',
        userId: 'user-2',
        name: 'Member',
        lastName: 'User',
        contactPhone: '',
        role: 'participant',
        rsvpStatus: 'confirmed',
        createdAt: ts,
        updatedAt: ts,
      },
    ]);

    const { result } = renderHook(() => usePlanRole(plan));

    const ownItem = makeItem('p-2');
    const otherItem = makeItem('p-other');

    expect(result.current.canEditItem).toBeDefined();
    expect(result.current.canEditItem!(ownItem)).toBe(true);
    expect(result.current.canEditItem!(otherItem)).toBe(false);
  });

  it('returns undefined currentParticipant when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    const plan = makePlan([
      {
        participantId: 'p-1',
        planId: 'plan-1',
        userId: 'user-1',
        name: 'Owner',
        lastName: 'User',
        contactPhone: '',
        role: 'owner',
        rsvpStatus: 'confirmed',
        createdAt: ts,
        updatedAt: ts,
      },
    ]);

    const { result } = renderHook(() => usePlanRole(plan));

    expect(result.current.isOwner).toBe(false);
    expect(result.current.currentParticipant).toBeUndefined();
  });

  it('returns isOwner=false when plan has no participants', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-1' } as ReturnType<typeof useAuth>['user'],
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
    });

    const plan = makePlan([]);

    const { result } = renderHook(() => usePlanRole(plan));

    expect(result.current.isOwner).toBe(false);
    expect(result.current.currentParticipant).toBeUndefined();
  });
});
