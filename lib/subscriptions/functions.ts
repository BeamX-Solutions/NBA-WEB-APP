import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCheckout, parseConfirmation, type Checkout, type Confirmation, type PlanId } from "./contracts";

/**
 * Calls to the subscription Edge Functions, with the practitioner's own session. supabase-js
 * sends the session's access token, so the functions act for the signed-in practitioner and no
 * key of ours reaches the browser.
 */

type Result<T> = { data: T; error: null } | { data: null; error: string };

/** A function's error body carries a message written for the practitioner. */
async function messageOf(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    const body = await context.json().catch(() => null) as { error?: unknown } | null;
    if (typeof body?.error === "string" && body.error.length > 0) return body.error;
  }
  return fallback;
}

export async function startCheckout(client: SupabaseClient, plan: PlanId, callbackUrl: string): Promise<Result<Checkout>> {
  const fallback = "The payment could not be started. Please try again.";
  const { data, error } = await client.functions.invoke("subscription-checkout", { body: { plan, callbackUrl } });
  if (error) return { data: null, error: await messageOf(error, fallback) };
  const checkout = parseCheckout(data);
  return checkout ? { data: checkout, error: null } : { data: null, error: fallback };
}

export async function confirmCheckout(client: SupabaseClient, reference: string): Promise<Result<Confirmation>> {
  const fallback = "Your payment could not be checked. Please try again.";
  const { data, error } = await client.functions.invoke("subscription-confirm", { body: { reference } });
  if (error) return { data: null, error: await messageOf(error, fallback) };
  const confirmation = parseConfirmation(data);
  return confirmation ? { data: confirmation, error: null } : { data: null, error: fallback };
}
