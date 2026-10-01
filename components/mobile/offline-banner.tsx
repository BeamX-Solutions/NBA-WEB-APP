"use client";

import { useOnline } from "@/lib/use-online";
import { Icon } from "./icon";

/**
 * mobile components/ui/OfflineBanner. Being disconnected is a mode, not an error: the calculator still
 * works and some things will not, and saying which stops a failed upload looking like a bug.
 */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-text px-4 pt-[max(4px,env(safe-area-inset-top))] pb-2 text-text-inverse" role="alert">
    <Icon name="cloud-off" size={16}/>
    <p className="flex-1 text-caption font-semibold">You are offline. The calculator still works; invoices and uploads will not.</p>
  </div>;
}
