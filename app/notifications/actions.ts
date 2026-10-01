"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/calculator/contracts";
import { createClient } from "@/lib/supabase/server";

export type MarkReadResult = { ok: boolean };

/** Marks the practitioner's own notifications read: those named, or all of them when `ids` is null. */
export async function markNotificationsReadAction(ids: string[] | null): Promise<MarkReadResult> {
  if (ids !== null && (!Array.isArray(ids) || ids.length === 0 || !ids.every(isUuid))) return { ok: false };
  try {
    const client = await createClient();
    const { error } = await client.rpc("mark_notifications_read", { p_ids: ids });
    if (error) return { ok: false };
    // The header's unread count is rendered on every page.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch { return { ok: false }; }
}
