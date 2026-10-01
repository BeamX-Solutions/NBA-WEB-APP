/**
 * How this browser can install the app, decided from facts the page can observe. Pure, so the rules
 * are tested without a browser; lib/pwa/install-store.ts feeds it the live values.
 *
 * - one-tap: the browser fired beforeinstallprompt (Chrome, Edge, Samsung Internet), so a button
 *   can open its own install dialog.
 * - ios-guide: iPhone or iPad, where Apple allows no programmatic install but Share → Add to Home
 *   Screen works.
 * - installed: running as the installed app, or this browser recorded an install.
 * - unsupported: anything else (desktop Safari and Firefox, Android in-app browsers).
 * - unknown: not yet read (server render, before hydration). Nothing is shown.
 */
export type InstallKind = "one-tap" | "ios-guide" | "installed" | "unsupported" | "unknown";

export type InstallFacts = {
  userAgent: string;
  /** Touch points: an iPad asks for the desktop site and reports itself as a Mac. */
  maxTouchPoints: number;
  standalone: boolean;
  hasPromptEvent: boolean;
  installedFlag: boolean;
};

export const SNOOZE_DAYS = 14;

/**
 * Run before hydration by the root layout: keeps Chrome's one-off "installable" event for
 * lib/pwa/install-store, and stops the browser's own mini-infobar. Lives here, not in a client
 * component, so the server-rendered layout receives the text itself.
 */
export const EARLY_INSTALL_CAPTURE = "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__nbaInstallPrompt=e;});";

const DAY = 24 * 60 * 60 * 1000;

export function isIos(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/**
 * Apps that open links in their own browser, which cannot install. Best effort: WhatsApp, for one,
 * opens links in a standard Safari or Chrome view that cannot be told apart.
 */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|Twitter|BytedanceWebview|musical_ly|Line\//.test(userAgent);
}

export function installKind(facts: InstallFacts): InstallKind {
  if (facts.standalone) return "installed";
  // Chrome fires the event again after an uninstall, so it outranks a stale installed flag.
  if (facts.hasPromptEvent) return "one-tap";
  if (facts.installedFlag) return "installed";
  if (isIos(facts.userAgent, facts.maxTouchPoints)) return "ios-guide";
  return "unsupported";
}

/** Whether the banner may show: installable, and not dismissed in the last SNOOZE_DAYS. */
export function shouldShowBanner(kind: InstallKind, dismissedAt: number | null, now: number): boolean {
  if (kind !== "one-tap" && kind !== "ios-guide") return false;
  return dismissedAt === null || now - dismissedAt >= SNOOZE_DAYS * DAY;
}

/** A stored dismissal time, or null when it is missing or unreadable. */
export function parseDismissedAt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const time = Number(value);
  return Number.isSafeInteger(time) ? time : null;
}
