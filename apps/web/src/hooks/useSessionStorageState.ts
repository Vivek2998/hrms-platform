import { useState, useCallback } from 'react';

/**
 * Drop-in replacement for useState that persists the value in sessionStorage
 * so the correct tab/section is restored after a page refresh.
 *
 * All keys are automatically namespaced under `hrms_ui_` so they can be
 * wiped cleanly on logout (see auth.store.ts).
 *
 * Usage:
 *   const [tab, setTab] = useSessionStorageState<Tab>('leaves_tab', 'PENDING');
 *
 * Security properties:
 *   • Value never appears in the URL, server logs, or Referer headers.
 *   • sessionStorage is tab-scoped — cleared automatically when the browser
 *     tab or window is closed.
 *   • On logout, auth.store.ts wipes every `hrms_ui_*` key so a different
 *     user logging in on the same tab cannot see the previous session's state.
 *   • try/catch guards against browsers that block storage (private mode,
 *     storage quota exceeded).
 */
export function useSessionStorageState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const storageKey = `hrms_ui_${key}`;

  const [value, setValueState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return (stored as T) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (newValue: T) => {
      try {
        if (newValue === defaultValue) {
          // Remove the key when back at default — keeps sessionStorage lean
          sessionStorage.removeItem(storageKey);
        } else {
          sessionStorage.setItem(storageKey, newValue);
        }
      } catch {
        // sessionStorage unavailable — silently fall back to in-memory state
      }
      setValueState(newValue);
    },
    [storageKey, defaultValue],
  );

  return [value, setValue];
}
