import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../../../src/contexts/useAuth';
import AuthProvider from '../../../src/contexts/AuthProvider';
import type { ReactNode } from 'react';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('returns auth context values when inside AuthProvider', async () => {
    let result: { current: ReturnType<typeof useAuth> };
    await act(async () => {
      ({ result } = renderHook(() => useAuth(), { wrapper }));
    });

    expect(result!.current).toHaveProperty('session');
    expect(result!.current).toHaveProperty('user');
    expect(result!.current).toHaveProperty('loading');
    expect(result!.current).toHaveProperty('signOut');
    expect(typeof result!.current.signOut).toBe('function');
  });

  it('starts with null session and user', async () => {
    let result: { current: ReturnType<typeof useAuth> };
    await act(async () => {
      ({ result } = renderHook(() => useAuth(), { wrapper }));
    });

    await waitFor(() => {
      expect(result!.current.session).toBeNull();
      expect(result!.current.user).toBeNull();
    });
  });
});
