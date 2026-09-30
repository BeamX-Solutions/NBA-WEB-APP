"use client";

/**
 * The offline page is served in place of whatever page was asked for, so the address bar still shows
 * that page. Reloading retries it through the network.
 */
export function TryAgainButton() {
  return <button className="rounded-full border-0 bg-primary px-3 py-2 text-label font-semibold text-text-inverse" onClick={() => window.location.reload()} type="button">Try again</button>;
}
