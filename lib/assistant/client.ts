import { parseAssistantReply, parseAssistantState, type AssistantState } from "./contracts.ts";

/**
 * The browser's calls to /api/assistant. Same origin, so the session cookie goes with them and no
 * key is involved. Each returns the message to show when something goes wrong.
 */

type Result<T> = { data: T; error: null } | { data: null; error: string };

const unreachable = "The assistant could not be reached. Check your connection and try again.";

async function errorOf(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof body?.error === "string" && body.error ? body.error : fallback;
}

export async function openAssistant(): Promise<Result<AssistantState>> {
  try {
    const response = await fetch("/api/assistant", { cache: "no-store" });
    if (!response.ok) return { data: null, error: await errorOf(response, "The assistant could not be opened. Try again.") };
    const state = parseAssistantState(await response.json());
    return state ? { data: state, error: null } : { data: null, error: "The assistant could not be opened. Try again." };
  } catch { return { data: null, error: unreachable }; }
}

export async function sendQuestion(message: string): Promise<Result<string>> {
  try {
    const response = await fetch("/api/assistant", {
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) return { data: null, error: await errorOf(response, "The assistant could not answer just now. Please try again.") };
    const parsed = parseAssistantReply(await response.json());
    return parsed ? { data: parsed.reply, error: null } : { data: null, error: "The assistant could not answer just now. Please try again." };
  } catch { return { data: null, error: unreachable }; }
}

export async function clearConversation(): Promise<Result<true>> {
  try {
    const response = await fetch("/api/assistant", { method: "DELETE" });
    if (!response.ok) return { data: null, error: await errorOf(response, "The conversation could not be cleared. Try again.") };
    return { data: true, error: null };
  } catch { return { data: null, error: unreachable }; }
}
