import { describe, expect, it, vi } from 'vitest';
import { emitAuthError, onAuthError } from '../../../src/core/auth-error';

describe('auth-error event bus', () => {
  it('calls listener when emitAuthError is called', () => {
    const listener = vi.fn();
    const unsubscribe = onAuthError(listener);

    emitAuthError();
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
  });

  it('supports multiple listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const unsub1 = onAuthError(listener1);
    const unsub2 = onAuthError(listener2);

    emitAuthError();
    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();

    unsub1();
    unsub2();
  });

  it('stops calling listener after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = onAuthError(listener);

    emitAuthError();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    emitAuthError();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no listeners are registered', () => {
    expect(() => emitAuthError()).not.toThrow();
  });
});
