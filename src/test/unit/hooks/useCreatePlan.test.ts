import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCreatePlan } from '../../../hooks/useCreatePlan';
import * as apiModule from '../../../core/api';

vi.mock('../../../core/api', () => ({
  createPlan: vi.fn(),
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

  it('should call createPlan API with the provided payload', async () => {
    const mockPlan = {
      planId: 'plan-123',
      title: 'Test Plan',
      status: 'draft' as const,
      visibility: 'public' as const,
      ownerParticipantId: 'owner-1',
      createdAt: '2025-12-12T00:00:00Z',
      updatedAt: '2025-12-12T00:00:00Z',
    };
    const mockCreatePlan = vi.mocked(apiModule.createPlan);
    mockCreatePlan.mockResolvedValue(mockPlan);

    const payload = {
      title: 'Test Plan',
      status: 'draft' as const,
      visibility: 'public' as const,
      ownerParticipantId: 'owner-1',
    };

    const { result } = renderHook(() => useCreatePlan(), { wrapper });

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreatePlan).toHaveBeenCalledTimes(1);
    expect(mockCreatePlan).toHaveBeenCalledWith(payload);
    expect(result.current.data).toEqual(mockPlan);
  });

  it('should invalidate plans query cache on success', async () => {
    const mockPlan = {
      planId: 'plan-456',
      title: 'Another Plan',
      status: 'draft' as const,
      visibility: 'private' as const,
      ownerParticipantId: 'owner-2',
      createdAt: '2025-12-12T00:00:00Z',
      updatedAt: '2025-12-12T00:00:00Z',
    };
    vi.mocked(apiModule.createPlan).mockResolvedValue(mockPlan);

    queryClient.setQueryData(['plans'], [{ planId: 'existing' }]);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePlan(), { wrapper });

    result.current.mutate({
      title: 'Another Plan',
      status: 'draft' as const,
      visibility: 'private' as const,
      ownerParticipantId: 'owner-2',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plans'] });
  });

  it('should set error state when API call fails', async () => {
    vi.mocked(apiModule.createPlan).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useCreatePlan(), { wrapper });

    result.current.mutate({
      title: 'Fail Plan',
      status: 'draft' as const,
      visibility: 'public' as const,
      ownerParticipantId: 'owner-3',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });
});
