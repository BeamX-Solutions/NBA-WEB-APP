"use client";

import { useSyncExternalStore } from "react";

function subscribe(notify: () => void): () => void {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

/**
 * Whether the browser reports a connection. Only an explicit offline signal counts, so nothing flashes
 * on load (the server render and first paint assume online), as mobile's banner does with NetInfo.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
