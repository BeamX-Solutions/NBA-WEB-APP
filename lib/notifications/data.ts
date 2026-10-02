import "server-only";
import { requireSession } from "@/lib/supabase/request";
import { parseNotification, type AppNotification } from "./contracts";

const columns = "id, kind, title, body, link, created_at, read_at";
const pageSize = 50;
const loadError = "Your notifications could not be loaded. Check your connection and try again.";

/** The newest notifications, as RLS allows: only the signed-in practitioner's own. */
export async function loadNotifications(): Promise<{ notifications: AppNotification[]; error: string | null }> {
  const { client } = await requireSession("/notifications");
  try {
    const { data, error } = await client.from("notifications").select(columns).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(pageSize);
    if (error) return { notifications: [], error: loadError };
    const now = new Date();
    const notifications = (data ?? []).map((row) => parseNotification(row, now)).filter((row): row is AppNotification => row !== null);
    return { notifications, error: null };
  } catch { return { notifications: [], error: loadError }; }
}
