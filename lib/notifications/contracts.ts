import { safeInternalPath } from "../auth/validation.ts";
import { isUuid } from "../calculator/contracts.ts";
import { asRow, formatLagosDate, text } from "../transactions/contracts.ts";

/** The kinds the notifications table allows; each is raised by one database trigger. */
export const NOTIFICATION_KINDS = [
  "membership_approved",
  "membership_rejected",
  "payment_rejected",
  "certificate_issued",
  "share_paid",
  "certificate_revoked",
  "certificate_restored",
] as const;

export type NotificationKind = typeof NOTIFICATION_KINDS[number];

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** An internal app path, or null when the notification leads nowhere. */
  link: string | null;
  /** "Just now", "5 min ago", "Yesterday", or a date. */
  when: string;
  read: boolean;
};

export type NotificationTone = "success" | "danger";

const presentation: Record<NotificationKind, { icon: string; tone: NotificationTone }> = {
  membership_approved: { icon: "how-to-reg", tone: "success" },
  membership_rejected: { icon: "person-off", tone: "danger" },
  payment_rejected: { icon: "error-outline", tone: "danger" },
  certificate_issued: { icon: "verified", tone: "success" },
  share_paid: { icon: "payments", tone: "success" },
  certificate_revoked: { icon: "gpp-bad", tone: "danger" },
  certificate_restored: { icon: "verified-user", tone: "success" },
};

export function notificationPresentation(kind: NotificationKind): { icon: string; tone: NotificationTone } {
  return presentation[kind];
}

function isKind(value: unknown): value is NotificationKind {
  return typeof value === "string" && (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

/** Only a path inside this app is followed; anything else is dropped rather than rewritten to "/". */
export function notificationLink(value: unknown): string | null {
  const path = text(value);
  if (!path) return null;
  const safe = safeInternalPath(path);
  return safe === path ? safe : null;
}

const minute = 60_000;
const hour = 60 * minute;

export function relativeTime(createdAt: Date, now: Date): string {
  const elapsed = now.getTime() - createdAt.getTime();
  if (elapsed < minute) return "Just now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)} min ago`;
  if (elapsed < 24 * hour) return `${Math.floor(elapsed / hour)} h ago`;
  if (elapsed < 48 * hour) return "Yesterday";
  return formatLagosDate(createdAt.toISOString(), "long") ?? "";
}

export function parseNotification(value: unknown, now: Date): AppNotification | null {
  const row = asRow(value);
  if (!row || !isUuid(row.id) || !isKind(row.kind)) return null;
  const title = text(row.title);
  const body = text(row.body);
  if (!title || !body || typeof row.created_at !== "string") return null;
  const createdAt = new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) return null;
  if (row.read_at !== null && typeof row.read_at !== "string") return null;
  return {
    id: row.id,
    kind: row.kind,
    title,
    body,
    link: notificationLink(row.link),
    when: relativeTime(createdAt, now),
    read: row.read_at !== null,
  };
}

/** "9+" past nine, as the header badge shows it; empty when there is nothing unread. */
export function unreadBadge(count: number): string {
  if (!Number.isInteger(count) || count <= 0) return "";
  return count > 9 ? "9+" : String(count);
}
