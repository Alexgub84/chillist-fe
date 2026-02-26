import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useBulkAssign } from '../../../src/hooks/useBulkAssign';
import * as apiModule from '../../../src/core/api';
import type { Participant } from '../../../src/core/schemas/participant';
import type { BulkItemResponse } from '../../../src/core/schemas/item';

vi.mock('../../../src/core/api', () => ({
  bulkUpdateItems: vi.fn(),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToast }));

const participants: Participant[] = [
  {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Alex',
    lastName: 'Smith',
    contactPhone: '',
    role: 'owner',
    rsvpStatus: 'confirmed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const successResponse: BulkItemResponse = {
  items: [
    {
      itemId: 'i-1',
      planId: 'plan-1',
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      unit: 'pcs',
      status: 'pending',
      assignedParticipantId: 'p-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ],
  errors: [],
};

const partialResponse: BulkItemResponse = {
  items: [successResponse.items[0]],
  errors: [{ name: 'i-2', message: 'Item not found' }],
};

describe('useBulkAssign', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  }

  it('calls bulkUpdateItems with correct entries', async () => {
    const mockBulk = vi.mocked(apiModule.bulkUpdateItems);
    mockBulk.mockResolvedValue(successResponse);

    const { result } = renderHook(() => useBulkAssign('plan-1', participants), {
      wrapper,
    });

    result.current.mutate({ itemIds: ['i-1'], participantId: 'p-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockBulk).toHaveBeenCalledWith('plan-1', [
      { itemId: 'i-1', assignedParticipantId: 'p-1' },
    ]);
  });

  it('shows success toast with participant name on full success', async () => {
    vi.mocked(apiModule.bulkUpdateItems).mockResolvedValue(successResponse);

    const { result } = renderHook(() => useBulkAssign('plan-1', participants), {
      wrapper,
    });

    result.current.mutate({ itemIds: ['i-1'], participantId: 'p-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.success).toHaveBeenCalledOnce();
    expect(mockToast.success).toHaveBeenCalledWith(
      expect.stringContaining('1')
    );
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('shows partial error toast on 207 response', async () => {
    vi.mocked(apiModule.bulkUpdateItems).mockResolvedValue(partialResponse);

    const { result } = renderHook(() => useBulkAssign('plan-1', participants), {
      wrapper,
    });

    result.current.mutate({ itemIds: ['i-1', 'i-2'], participantId: 'p-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.error).toHaveBeenCalledOnce();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('shows error toast on API failure', async () => {
    vi.mocked(apiModule.bulkUpdateItems).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useBulkAssign('plan-1', participants), {
      wrapper,
    });

    result.current.mutate({ itemIds: ['i-1'], participantId: 'p-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.error).toHaveBeenCalledOnce();
  });

  it('invalidates plan query cache on settled', async () => {
    vi.mocked(apiModule.bulkUpdateItems).mockResolvedValue(successResponse);
    queryClient.setQueryData(['plan', 'plan-1'], { planId: 'plan-1' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBulkAssign('plan-1', participants), {
      wrapper,
    });

    result.current.mutate({ itemIds: ['i-1'], participantId: 'p-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['plan', 'plan-1'],
    });
  });
});
