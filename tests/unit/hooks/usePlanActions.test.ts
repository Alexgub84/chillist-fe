import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanActions } from '../../../src/hooks/usePlanActions';

const mockCreateItem = { mutateAsync: vi.fn(), isPending: false };
const mockUpdateItem = { mutateAsync: vi.fn(), isPending: false };
const mockUpdateParticipant = { mutateAsync: vi.fn(), isPending: false };
const mockDeletePlan = { mutateAsync: vi.fn(), isPending: false };
const mockUpdatePlan = { mutateAsync: vi.fn(), isPending: false };

vi.mock('../../../src/hooks/useCreateItem', () => ({
  useCreateItem: () => mockCreateItem,
}));
vi.mock('../../../src/hooks/useUpdateItem', () => ({
  useUpdateItem: () => mockUpdateItem,
}));
vi.mock('../../../src/hooks/useUpdateParticipant', () => ({
  useUpdateParticipant: () => mockUpdateParticipant,
}));
vi.mock('../../../src/hooks/useDeletePlan', () => ({
  useDeletePlan: () => mockDeletePlan,
}));
vi.mock('../../../src/hooks/useUpdatePlan', () => ({
  useUpdatePlan: () => mockUpdatePlan,
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToast }));

const mockParticipants = [
  {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Alex',
    lastName: 'Smith',
    contactPhone: '',
    role: 'owner' as const,
    rsvpStatus: 'confirmed' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    participantId: 'p-2',
    planId: 'plan-1',
    name: 'Bob',
    lastName: 'Jones',
    contactPhone: '',
    role: 'participant' as const,
    rsvpStatus: 'confirmed' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('usePlanActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateItem.mutateAsync.mockResolvedValue({});
    mockUpdateItem.mutateAsync.mockResolvedValue({});
    mockUpdateParticipant.mutateAsync.mockResolvedValue({});
    mockDeletePlan.mutateAsync.mockResolvedValue({});
    mockUpdatePlan.mutateAsync.mockResolvedValue({});
  });

  it('createOrUpdateItem calls createItem when no editingItemId', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Tent',
          category: 'equipment',
          subcategory: '',
          quantity: 1,
          unit: 'pcs',
          status: 'pending',
          notes: '',
          assignedParticipantId: '',
        },
        null
      )
    );

    expect(mockCreateItem.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Tent', category: 'equipment' })
    );
    expect(mockUpdateItem.mutateAsync).not.toHaveBeenCalled();
  });

  it('createOrUpdateItem calls updateItem when editingItemId is provided', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Tent',
          category: 'equipment',
          subcategory: '',
          quantity: 2,
          unit: 'pcs',
          status: 'pending',
          notes: '',
          assignedParticipantId: '',
        },
        'item-1'
      )
    );

    expect(mockUpdateItem.mutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      updates: expect.objectContaining({ name: 'Tent', quantity: 2 }),
    });
    expect(mockCreateItem.mutateAsync).not.toHaveBeenCalled();
  });

  it('deletePlan returns true on success and shows toast', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    let success = false;
    await act(async () => {
      success = await result.current.deletePlan();
    });

    expect(success).toBe(true);
    expect(mockDeletePlan.mutateAsync).toHaveBeenCalledWith('plan-1');
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('deletePlan returns false on error and shows error toast', async () => {
    mockDeletePlan.mutateAsync.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    let success = true;
    await act(async () => {
      success = await result.current.deletePlan();
    });

    expect(success).toBe(false);
    expect(mockToast.error).toHaveBeenCalled();
  });

  it('updatePlanDetails returns true on success', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    let success = false;
    await act(async () => {
      success = await result.current.updatePlanDetails({ title: 'New Title' });
    });

    expect(success).toBe(true);
    expect(mockUpdatePlan.mutateAsync).toHaveBeenCalledWith({
      title: 'New Title',
    });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('updatePlanDetails returns false on error', async () => {
    mockUpdatePlan.mutateAsync.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    let success = true;
    await act(async () => {
      success = await result.current.updatePlanDetails({ title: 'New' });
    });

    expect(success).toBe(false);
    expect(mockToast.error).toHaveBeenCalled();
  });

  it('transferPlanOwnership calls updateParticipant with owner role', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() => result.current.transferPlanOwnership('p-2'));

    expect(mockUpdateParticipant.mutateAsync).toHaveBeenCalledWith({
      participantId: 'p-2',
      updates: { role: 'owner' },
    });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('transferPlanOwnership shows error toast on failure', async () => {
    mockUpdateParticipant.mutateAsync.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() => result.current.transferPlanOwnership('p-2'));

    expect(mockToast.error).toHaveBeenCalled();
  });

  it('updateParticipantPreferences shows success toast', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.updateParticipantPreferences('p-1', {
        adultsCount: 2,
        kidsCount: 1,
        foodPreferences: 'vegan',
        allergies: '',
        notes: '',
      })
    );

    expect(mockUpdateParticipant.mutateAsync).toHaveBeenCalledWith({
      participantId: 'p-1',
      updates: expect.objectContaining({ adultsCount: 2, kidsCount: 1 }),
    });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('updateSingleItem shows error toast on failure', async () => {
    mockUpdateItem.mutateAsync.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.updateSingleItem('item-1', { status: 'purchased' })
    );

    expect(mockToast.error).toHaveBeenCalled();
  });

  it('toItemPayload converts empty strings to null and uses buildAssignmentPayload', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Water',
          category: 'food',
          subcategory: '',
          quantity: 1,
          unit: 'l',
          status: 'pending',
          notes: '',
          assignedParticipantId: '',
        },
        null
      )
    );

    expect(mockCreateItem.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        subcategory: null,
        notes: null,
        assignmentStatusList: [],
        isAllParticipants: false,
      })
    );
  });

  it('create with specific participant sends assignmentStatusList', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Tent',
          category: 'equipment',
          subcategory: '',
          quantity: 1,
          unit: 'pcs',
          status: 'pending',
          notes: '',
          assignedParticipantId: 'p-1',
        },
        null
      )
    );

    expect(mockCreateItem.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
        isAllParticipants: false,
      })
    );
  });

  it('create with __all__ sends isAllParticipants: true and all participants in assignmentStatusList', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Tent',
          category: 'equipment',
          subcategory: '',
          quantity: 1,
          unit: 'pcs',
          status: 'pending',
          notes: '',
          assignedParticipantId: '__all__',
        },
        null
      )
    );

    expect(mockCreateItem.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        isAllParticipants: true,
        assignmentStatusList: [
          { participantId: 'p-1', status: 'pending' },
          { participantId: 'p-2', status: 'pending' },
        ],
      })
    );
  });

  it('update with specific participant sends assignmentStatusList', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Tent',
          category: 'equipment',
          subcategory: '',
          quantity: 1,
          unit: 'pcs',
          status: 'pending',
          notes: '',
          assignedParticipantId: 'p-2',
        },
        'item-1'
      )
    );

    expect(mockUpdateItem.mutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      updates: expect.objectContaining({
        assignmentStatusList: [{ participantId: 'p-2', status: 'pending' }],
        isAllParticipants: false,
      }),
    });
  });

  it('update with __all__ sends isAllParticipants: true', async () => {
    const { result } = renderHook(() =>
      usePlanActions('plan-1', mockParticipants)
    );

    await act(() =>
      result.current.createOrUpdateItem(
        {
          name: 'Tent',
          category: 'equipment',
          subcategory: '',
          quantity: 1,
          unit: 'pcs',
          status: 'pending',
          notes: '',
          assignedParticipantId: '__all__',
        },
        'item-1'
      )
    );

    expect(mockUpdateItem.mutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      updates: expect.objectContaining({
        isAllParticipants: true,
        assignmentStatusList: [
          { participantId: 'p-1', status: 'pending' },
          { participantId: 'p-2', status: 'pending' },
        ],
      }),
    });
  });
});
