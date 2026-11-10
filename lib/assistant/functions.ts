import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { functionErrorMessage } from "@/lib/supabase/function-error";
import { parseAssistantReply } from "./contracts";

/**
 * The call to the assistant Edge Function, with the practitioner's own session. The function
 * checks their subscription and rate limit, and its tools see only their records.
 */

type Result<T> = { data: T; error: null } | { data: null; error: string; status: number };

function statusOf(error: unknown): number {
  const context = (error as { context?: unknown } | null)?.context;
  return context instanceof Response && context.status >= 400 ? context.status : 502;
}

export async function askAssistant(client: SupabaseClient, message: string): Promise<Result<{ reply: string }>> {
  const fallback = "The assistant could not answer just now. Please try again.";
  const { data, error } = await client.functions.invoke("assistant", { body: { message } });
  if (error) return { data: null, error: await functionErrorMessage(error, fallback), status: statusOf(error) };
  const parsed = parseAssistantReply(data);
  return parsed ? { data: { reply: parsed.reply }, error: null } : { data: null, error: fallback, status: 502 };
}
