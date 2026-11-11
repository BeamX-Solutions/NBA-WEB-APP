import { asRow, text } from "../transactions/contracts.ts";

/** The database refuses longer messages (assistant_begin_turn). */
export const MAX_QUESTION_LENGTH = 2000;

/** Shown on an empty conversation; tapping one sends it. */
export const SUGGESTED_QUESTIONS = [
  "What is pending for me?",
  "Which of my proofs were rejected, and why?",
  "What has my branch paid me this month?",
  "What is the minimum fee for a ₦25m deed of assignment?",
] as const;

export type ChatRole = "user" | "assistant";

export type ChatMessage = { id: string; role: ChatRole; content: string };

/** The question as the function will receive it, or null when there is nothing to send or it is too long. */
export function validQuestion(value: unknown): string | null {
  const question = text(value);
  if (question === null || question.length > MAX_QUESTION_LENGTH) return null;
  return question;
}

function parseChatMessage(value: unknown): ChatMessage | null {
  const row = asRow(value);
  if (!row) return null;
  const id = text(row.id);
  const content = text(row.content);
  const role = row.role;
  if (!id || !content || (role !== "user" && role !== "assistant")) return null;
  return { id, role, content };
}

/** Stored rows, newest first as queried, as the conversation reads: oldest first. Malformed rows are dropped. */
export function parseChatMessages(rows: unknown): ChatMessage[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(parseChatMessage).filter((message): message is ChatMessage => message !== null).reverse();
}

/** What opening the chat finds: the plans prompt, or the conversation so far. */
export type AssistantState = { kind: "not-subscribed" } | { kind: "ready"; messages: ChatMessage[] };

/** The GET /api/assistant body. Messages arrive already in reading order. */
export function parseAssistantState(value: unknown): AssistantState | null {
  const row = asRow(value);
  if (row?.kind === "not-subscribed") return { kind: "not-subscribed" };
  if (row?.kind !== "ready" || !Array.isArray(row.messages)) return null;
  return { kind: "ready", messages: parseChatMessages([...row.messages].reverse()) };
}

/** The function's success body: { reply, messageId }. */
export function parseAssistantReply(value: unknown): { reply: string; messageId: string | null } | null {
  const row = asRow(value);
  const reply = text(row?.reply);
  if (!row || !reply) return null;
  return { reply, messageId: text(row.messageId) };
}
