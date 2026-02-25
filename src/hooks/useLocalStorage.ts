import { useState, useCallback } from 'react';

function readValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(
      `[useLocalStorage] Failed to read key="${key}" from localStorage. Using fallback. Error: ${err instanceof Error ? err.message : String(err)}`
    );
    return fallback;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readValue(key, initialValue)
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
          console.warn(
            `[useLocalStorage] Failed to write key="${key}" to localStorage (quota exceeded or unavailable). Error: ${err instanceof Error ? err.message : String(err)}`
          );
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
