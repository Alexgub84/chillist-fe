import { useEffect, useRef } from 'react';

const ATTR = 'data-scroll-item-id';
const DEBOUNCE_MS = 150;
const MAX_RESTORE_ATTEMPTS = 10;
const RESTORE_INTERVAL_MS = 50;

function getStorageKey(key: string) {
  return `scroll-item:${key}`;
}

function findCenterItemId(): string | null {
  const elements = document.querySelectorAll<HTMLElement>(`[${ATTR}]`);
  if (elements.length === 0) return null;

  const viewportCenter = window.innerHeight / 2;
  let closestId: string | null = null;
  let closestDist = Infinity;

  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

    const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter);
    if (dist < closestDist) {
      closestDist = dist;
      closestId = el.getAttribute(ATTR);
    }
  }

  return closestId;
}

function isElementInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
}

export function useScrollRestore(key: string, isReady: boolean) {
  const restoredRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function handleScroll() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const id = findCenterItemId();
        if (id) {
          sessionStorage.setItem(getStorageKey(key), id);
        }
      }, DEBOUNCE_MS);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [key]);

  useEffect(() => {
    if (!isReady || restoredRef.current) return;
    restoredRef.current = true;

    const savedId = sessionStorage.getItem(getStorageKey(key));
    if (!savedId) return;

    let attempts = 0;

    function tryScroll() {
      const target = document.querySelector(`[${ATTR}="${savedId}"]`);
      if (!target) return;

      target.scrollIntoView({ behavior: 'instant', block: 'center' });

      if (isElementInViewport(target) || attempts >= MAX_RESTORE_ATTEMPTS) {
        return;
      }

      attempts++;
      setTimeout(tryScroll, RESTORE_INTERVAL_MS);
    }

    setTimeout(tryScroll, 0);
  }, [key, isReady]);
}
