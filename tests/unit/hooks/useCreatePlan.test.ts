import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCreatePlan } from '../../../src/hooks/useCreatePlan';
import * as apiModule from '../../../src/core/api';

vi.mock('../../../src/core/api', () => ({
  createPlanWithOwner: vi.fn(),
}));

describe('useCreatePlan', () => {
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

  const mockPlanWithDetails = {
    planId: 'plan-123',
    title: 'Test Plan',
    status: 'draft' as const,
    visibility: 'public' as const,
    ownerParticipantId: 'owner-1',
    createdAt: '2025-12-12T00:00:00Z',
    updatedAt: '2025-12-12T00:00:00Z',
    items: [],
    participants: [
      {
        participantId: 'owner-1',
        planId: 'plan-123',
        name: 'Test',
        lastName: 'Owner',
        contactPhone: '+1234567890',
        role: 'owner' as const,
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
      },
    ],
  };

  it('should call createPlanWithOwner API with the provided payload', async () => {
    const mockCreatePlan = vi.mocked(apiModule.createPlanWithOwner);
    mockCreatePlan.mockResolvedValue(mockPlanWithDetails);

    const payload = {
      title: 'Test Plan',
      owner: {
        name: 'Test',
        lastName: 'Owner',
        contactPhone: '+1234567890',
      },
    };

    const { result } = renderHook(() => useCreatePlan(), { wrapper });

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreatePlan).toHaveBeenCalledTimes(1);
    expect(mockCreatePlan).toHaveBeenCalledWith(payload);
    expect(result.current.data).toEqual(mockPlanWithDetails);
  });

  it('should invalidate plans query cache on success', async () => {
    vi.mocked(apiModule.createPlanWithOwner).mockResolvedValue(
      mockPlanWithDetails
    );

    queryClient.setQueryData(['plans'], [{ planId: 'existing' }]);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePlan(), { wrapper });

    result.current.mutate({
      title: 'Another Plan',
      owner: {
        name: 'Another',
        lastName: 'Owner',
        contactPhone: '+0000000000',
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plans'] });
  });

  it('should set error state when API call fails', async () => {
    vi.mocked(apiModule.createPlanWithOwner).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useCreatePlan(), { wrapper });

    result.current.mutate({
      title: 'Fail Plan',
      owner: {
        name: 'Fail',
        lastName: 'Owner',
        contactPhone: '+0000000000',
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });
});
