import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useUpdateParticipant } from '../../../src/hooks/useUpdateParticipant';
import * as apiModule from '../../../src/core/api';

vi.mock('../../../src/core/api', () => ({
  updateParticipant: vi.fn(),
}));

describe('useUpdateParticipant', () => {
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

  const mockParticipant = {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Alex',
    lastName: 'Smith',
    contactPhone: '+1234567890',
    role: 'owner' as const,
    adultsCount: 2,
    kidsCount: 1,
    foodPreferences: 'vegetarian',
    allergies: null,
    notes: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('calls updateParticipant API with correct arguments', async () => {
    const mockUpdate = vi.mocked(apiModule.updateParticipant);
    mockUpdate.mockResolvedValue(mockParticipant);

    const { result } = renderHook(() => useUpdateParticipant('plan-1'), {
      wrapper,
    });

    result.current.mutate({
      participantId: 'p-1',
      updates: { adultsCount: 2, kidsCount: 1 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith('p-1', {
      adultsCount: 2,
      kidsCount: 1,
    });
  });

  it('invalidates plan query cache on success', async () => {
    vi.mocked(apiModule.updateParticipant).mockResolvedValue(mockParticipant);

    queryClient.setQueryData(['plan', 'plan-1'], { planId: 'plan-1' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateParticipant('plan-1'), {
      wrapper,
    });

    result.current.mutate({
      participantId: 'p-1',
      updates: { foodPreferences: 'vegan' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['plan', 'plan-1'],
    });
  });

  it('sets error state when API call fails', async () => {
    vi.mocked(apiModule.updateParticipant).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useUpdateParticipant('plan-1'), {
      wrapper,
    });

    result.current.mutate({
      participantId: 'p-1',
      updates: { adultsCount: 5 },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });
});
