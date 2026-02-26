import { useEffect, useRef } from 'react';

const ATTR = 'data-scroll-item-id';
const DEBOUNCE_MS = 150;

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

export function useScrollRestore(key: string, isReady: boolean) {
  const restoredRef = useRef(false);

  useEffect(() => {
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

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
      sessionStorage.removeItem(getStorageKey(key));
      window.history.scrollRestoration = prev;
    };
  }, [key]);

  useEffect(() => {
    if (!isReady || restoredRef.current) return;
    restoredRef.current = true;

    const savedId = sessionStorage.getItem(getStorageKey(key));
    if (!savedId) return;

    requestAnimationFrame(() => {
      const target = document.querySelector(`[${ATTR}="${savedId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
  }, [key, isReady]);
}
