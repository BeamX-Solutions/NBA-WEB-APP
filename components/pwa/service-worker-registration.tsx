"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js in production builds. Development skips it, so a cached worker never hides
 * code changes; set NEXT_PUBLIC_ENABLE_SW=true to try it under `next dev`.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    const enabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true";
    if (!enabled || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Installability and offline use are enhancements; the app works without them.
    });
  }, []);
  return null;
}
