import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { usePlanWebSocket } from '../../../src/hooks/usePlanWebSocket';
import { supabase } from '../../../src/lib/supabase';

type MockWSInstance = {
  url: string;
  onopen: ((ev: Event) => void) | null;
  onclose: ((ev: { code: number; reason: string }) => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
};

let mockInstances: MockWSInstance[] = [];

class MockWebSocket {
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    mockInstances.push(this as unknown as MockWSInstance);
  }
}

const OriginalWebSocket = globalThis.WebSocket;

function mockGetSession(token: string | null) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: {
      session: token
        ? ({ access_token: token } as Parameters<
            typeof supabase.auth.getSession
          > extends never[]
            ? never
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              any)
        : null,
    },
    error: null,
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

function simulateOpen(instance: MockWSInstance) {
  instance.readyState = 1;
  instance.onopen?.(new Event('open'));
}

function simulateMessage(instance: MockWSInstance, data: unknown) {
  instance.onmessage?.({ data: JSON.stringify(data) });
}

function simulateClose(instance: MockWSInstance, code: number, reason = '') {
  instance.readyState = 3;
  instance.onclose?.({ code, reason });
}

describe('usePlanWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockInstances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    mockGetSession('test-jwt-token');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    globalThis.WebSocket = OriginalWebSocket;
    vi.restoreAllMocks();
  });

  it('connects to the correct URL with token', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    expect(mockInstances).toHaveLength(1);
    expect(mockInstances[0].url).toBe(
      'ws://localhost:3333/plans/plan-123/ws?token=test-jwt-token'
    );
  });

  it('derives ws:// from http:// API URL', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-1'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    expect(mockInstances[0].url).toMatch(/^ws:\/\//);
  });

  it('does not connect when no session token is available', async () => {
    mockGetSession(null);
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-1'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    expect(mockInstances).toHaveLength(0);
  });

  it('invalidates plan query on items:changed message', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateMessage(mockInstances[0], {
      event: 'items:changed',
      planId: 'plan-123',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['plan', 'plan-123'],
    });
  });

  it('does NOT invalidate on unknown event types', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateMessage(mockInstances[0], {
      event: 'expenses:changed',
      planId: 'plan-123',
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('closes WebSocket on unmount', async () => {
    const { wrapper } = createWrapper();

    const { unmount } = renderHook(() => usePlanWebSocket('plan-123'), {
      wrapper,
    });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);

    unmount();

    expect(mockInstances[0].close).toHaveBeenCalled();
  });

  it('does NOT reconnect on close code 4001', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateClose(mockInstances[0], 4001, 'Missing token');

    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(mockInstances).toHaveLength(1);
  });

  it('does NOT reconnect on close code 4003', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateClose(mockInstances[0], 4003, 'Invalid token');

    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(mockInstances).toHaveLength(1);
  });

  it('does NOT reconnect on close code 4004 (no access)', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateClose(mockInstances[0], 4004, 'Plan not found');

    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(mockInstances).toHaveLength(1);
  });

  it('does NOT reconnect on close code 4005 (pending join request)', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateClose(mockInstances[0], 4005, 'Pending join request');

    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(mockInstances).toHaveLength(1);
  });

  it('exposes wsCloseCode after close event', async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePlanWebSocket('plan-123'), {
      wrapper,
    });
    await act(() => vi.runAllTimersAsync());

    expect(result.current.wsCloseCode).toBeNull();

    simulateOpen(mockInstances[0]);
    await act(() => {
      simulateClose(mockInstances[0], 4005, 'Pending join request');
    });

    expect(result.current.wsCloseCode).toBe(4005);
  });

  it('resets wsCloseCode on successful reconnect', async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePlanWebSocket('plan-123'), {
      wrapper,
    });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    await act(() => {
      simulateClose(mockInstances[0], 1006);
    });

    expect(result.current.wsCloseCode).toBe(1006);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(() => {
      simulateOpen(mockInstances[1]);
    });

    expect(result.current.wsCloseCode).toBeNull();
  });

  it('reconnects on transient close (1006) with exponential backoff', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateClose(mockInstances[0], 1006);

    expect(mockInstances).toHaveLength(1);

    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(mockInstances).toHaveLength(1);

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(mockInstances).toHaveLength(2);

    simulateClose(mockInstances[1], 1006);

    await act(() => vi.advanceTimersByTimeAsync(1999));
    expect(mockInstances).toHaveLength(2);

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(mockInstances).toHaveLength(3);
  });

  it('resets reconnect attempts after successful connection', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => usePlanWebSocket('plan-123'), { wrapper });
    await act(() => vi.runAllTimersAsync());

    simulateOpen(mockInstances[0]);
    simulateClose(mockInstances[0], 1006);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(mockInstances).toHaveLength(2);

    simulateOpen(mockInstances[1]);
    simulateClose(mockInstances[1], 1006);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(mockInstances).toHaveLength(3);
  });
});
