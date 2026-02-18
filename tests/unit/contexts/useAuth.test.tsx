import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../../src/contexts/useAuth';
import AuthProvider from '../../../src/contexts/AuthProvider';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('returns auth context values when inside AuthProvider', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('session');
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('signOut');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('starts with null session and user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
