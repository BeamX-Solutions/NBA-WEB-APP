"use client";

import { useSyncExternalStore } from "react";

const localEvent = "nba-local-preview-change";

export function useLocalPreview(key: string): string | null {
  return useSyncExternalStore(
    (notify) => {
      const onStorage = (event: StorageEvent) => { if (event.key === key) notify(); };
      const onLocal = (event: Event) => { if ((event as CustomEvent<string>).detail === key) notify(); };
      window.addEventListener("storage", onStorage);
      window.addEventListener(localEvent, onLocal);
      return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(localEvent, onLocal); };
    },
    () => window.localStorage.getItem(key),
    () => null,
  );
}

export function writeLocalPreview(key: string, value: string): void {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent(localEvent, { detail: key }));
}
