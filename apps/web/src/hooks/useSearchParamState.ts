import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Drop-in replacement for useState that syncs a single string value to a URL
 * search param. On page refresh the param is still in the URL so the correct
 * tab/section is restored automatically.
 *
 * Usage:
 *   const [tab, setTab] = useSearchParamState<Tab>('tab', 'PENDING');
 *
 * When the value equals defaultValue the param is removed from the URL to keep
 * URLs clean (e.g. /leaves instead of /leaves?tab=PENDING).
 */
export function useSearchParamState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [params, setParams] = useSearchParams();

  const raw = params.get(key);
  const value = (raw !== null ? raw : defaultValue) as T;

  const setValue = useCallback(
    (newValue: T) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newValue === defaultValue) {
            next.delete(key);
          } else {
            next.set(key, newValue);
          }
          return next;
        },
        { replace: true }, // don't clutter browser history with every tab click
      );
    },
    [key, defaultValue, setParams],
  );

  return [value, setValue];
}
