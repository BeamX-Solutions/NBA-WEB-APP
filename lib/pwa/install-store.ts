"use client";

import { useSyncExternalStore } from "react";
import { installKind, isInAppBrowser, parseDismissedAt, shouldShowBanner, type InstallKind } from "./install";

/** Chrome's install event. Not in the DOM typings because it is not a standard. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Set by the early script in app/layout.tsx when the event fires before this module loads. */
declare global {
  interface Window { __nbaInstallPrompt?: Event }
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export type InstallSnapshot = {
  kind: InstallKind;
  inAppBrowser: boolean;
  /** Installable and not snoozed: the banner may show. */
  bannerVisible: boolean;
};

const INSTALLED_KEY = "install.installed.v1";
const DISMISSED_KEY = "install.dismissed-at.v1";
const serverSnapshot: InstallSnapshot = { kind: "unknown", inAppBrowser: false, bannerVisible: false };

let deferred: InstallPromptEvent | null = null;
let snapshot: InstallSnapshot | null = null;
let started = false;
const listeners = new Set<() => void>();

function storage(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

function read(key: string): string | null {
  try { return storage()?.getItem(key) ?? null; } catch { return null; }
}

/** Losing a write only means the banner may show again. */
function write(key: string, value: string): void {
  try { storage()?.setItem(key, value); } catch { /* nothing to do */ }
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function compute(): InstallSnapshot {
  const kind = installKind({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: isStandalone(),
    hasPromptEvent: deferred !== null,
    installedFlag: read(INSTALLED_KEY) === "true",
  });
  return { kind, inAppBrowser: isInAppBrowser(navigator.userAgent), bannerVisible: shouldShowBanner(kind, parseDismissedAt(read(DISMISSED_KEY)), Date.now()) };
}

function publish(): void {
  snapshot = compute();
  listeners.forEach((listener) => listener());
}

function capture(event: Event): void {
  // Stops the browser's own mini-infobar, so there are not two prompts.
  event.preventDefault();
  deferred = event as InstallPromptEvent;
  publish();
}

/** Starts listening once per page load. Called by InstallListener in the root layout. */
export function startInstallCapture(): void {
  if (started) return;
  started = true;
  if (window.__nbaInstallPrompt) capture(window.__nbaInstallPrompt);
  window.addEventListener("beforeinstallprompt", capture);
  window.addEventListener("appinstalled", () => {
    deferred = null;
    write(INSTALLED_KEY, "true");
    publish();
  });
}

/** Opens the browser's install dialog. Only works from a user's tap, and only once per event. */
export async function installApp(): Promise<InstallOutcome> {
  const event = deferred;
  if (!event) return "unavailable";
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") write(INSTALLED_KEY, "true");
  else write(DISMISSED_KEY, String(Date.now()));
  publish();
  return outcome;
}

/** "Not now": hides the banner for SNOOZE_DAYS on this device. */
export function snoozeInstallBanner(): void {
  write(DISMISSED_KEY, String(Date.now()));
  publish();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): InstallSnapshot {
  if (snapshot === null) snapshot = compute();
  return snapshot;
}

export function useInstallState(): InstallSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}
