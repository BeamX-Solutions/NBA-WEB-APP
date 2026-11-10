import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseChatMessages, type AssistantState } from "./contracts";

/** The most recent messages shown when the chat opens. */
const HISTORY_LIMIT = 50;

/**
 * Whether the practitioner may use the assistant, and if so their conversation. The subscription
 * check here only decides what to show; the database enforces it again on every message.
 */
export async function loadAssistantState(client: SupabaseClient, userId: string): Promise<AssistantState | null> {
  const subscription = await client
    .from("subscriptions")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (subscription.error) return null;
  if (!subscription.data) return { kind: "not-subscribed" };

  // The owner filter alongside row level security, which hides cleared messages.
  const history = await client
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (history.error) return null;

  return { kind: "ready", messages: parseChatMessages(history.data) };
}
