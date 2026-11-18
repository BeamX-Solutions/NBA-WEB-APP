import { NextResponse } from "next/server";
import { validQuestion, MAX_QUESTION_LENGTH } from "@/lib/assistant/contracts";
import { loadAssistantState } from "@/lib/assistant/data";
import { askAssistant } from "@/lib/assistant/functions";
import { createClient } from "@/lib/supabase/server";

/**
 * The floating chat's backend: GET opens it, POST asks, DELETE clears. A route handler rather than
 * server actions, which the client sends one at a time: a reply that takes several seconds would
 * otherwise hold up every other action in the app.
 *
 * Every method acts for the signed-in practitioner only and takes no user id from the request. The
 * proxy does not cover /api, so each checks the session itself.
 */

/** The assistant may use several tools before it answers. */
export const maxDuration = 60;

const sessionExpired = "Your session expired. Log in again to use the assistant.";

function json(body: unknown, status = 200): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/** Writes come only from this site's own pages, as JSON. */
function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

async function session() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  return error || !user ? null : { client, user };
}

export async function GET() {
  const signedIn = await session();
  if (!signedIn) return json({ error: sessionExpired }, 401);
  const state = await loadAssistantState(signedIn.client, signedIn.user.id);
  if (!state) return json({ error: "Your conversation could not be loaded. Try again." }, 500);
  return json(state);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "The message could not be authorized. Refresh and try again." }, 403);
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  const question = validQuestion(body?.message);
  if (question === null) return json({ error: `Type a question of up to ${MAX_QUESTION_LENGTH.toLocaleString("en-NG")} characters.` }, 400);

  const signedIn = await session();
  if (!signedIn) return json({ error: sessionExpired }, 401);

  const result = await askAssistant(signedIn.client, question);
  if (result.error !== null) return json({ error: result.error }, result.status);
  return json({ reply: result.data.reply });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "The conversation could not be cleared. Refresh and try again." }, 403);
  const signedIn = await session();
  if (!signedIn) return json({ error: sessionExpired }, 401);
  const { error } = await signedIn.client.rpc("assistant_clear_conversation");
  if (error) return json({ error: "The conversation could not be cleared. Check your connection and try again." }, 500);
  return json({ ok: true });
}
