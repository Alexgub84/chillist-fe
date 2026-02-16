import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollRestore } from '../../../src/hooks/useScrollRestore';

function createMockItem(id: string, top: number, height = 60) {
  const el = document.createElement('div');
  el.setAttribute('data-scroll-item-id', id);
  el.scrollIntoView = vi.fn();
  el.getBoundingClientRect = vi.fn(() => ({
    top,
    bottom: top + height,
    left: 0,
    right: 100,
    width: 100,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }));
  document.body.appendChild(el);
  return el;
}

describe('useScrollRestore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('saves the center item ID to sessionStorage on scroll', () => {
    createMockItem('item-1', 100);
    createMockItem('item-2', 350);
    createMockItem('item-3', 600);

    renderHook(() => useScrollRestore('plan-123', true));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(200);
    });

    expect(sessionStorage.getItem('scroll-item:plan-123')).toBe('item-2');
  });

  it('restores scroll position when isReady becomes true', () => {
    sessionStorage.setItem('scroll-item:plan-123', 'item-abc');
    const el = createMockItem('item-abc', 500);

    renderHook(() => useScrollRestore('plan-123', true));

    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'center',
    });
  });

  it('does not restore when isReady is false', () => {
    sessionStorage.setItem('scroll-item:plan-123', 'item-abc');
    const el = createMockItem('item-abc', 500);

    renderHook(() => useScrollRestore('plan-123', false));

    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not restore when no saved item in sessionStorage', () => {
    const el = createMockItem('item-abc', 500);

    renderHook(() => useScrollRestore('plan-123', true));

    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  it('gracefully handles deleted item (saved ID not in DOM)', () => {
    sessionStorage.setItem('scroll-item:plan-123', 'deleted-item');
    createMockItem('item-other', 200);

    expect(() => {
      renderHook(() => useScrollRestore('plan-123', true));
    }).not.toThrow();
  });

  it('only restores once even if isReady toggles', () => {
    sessionStorage.setItem('scroll-item:plan-123', 'item-abc');
    const el = createMockItem('item-abc', 500);

    const { rerender } = renderHook(
      ({ isReady }) => useScrollRestore('plan-123', isReady),
      { initialProps: { isReady: true } }
    );

    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);

    rerender({ isReady: false });
    rerender({ isReady: true });

    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('uses separate storage keys per plan', () => {
    createMockItem('item-a', 350);

    renderHook(() => useScrollRestore('plan-1', true));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(200);
    });

    expect(sessionStorage.getItem('scroll-item:plan-1')).toBe('item-a');
    expect(sessionStorage.getItem('scroll-item:plan-2')).toBeNull();
  });
});
