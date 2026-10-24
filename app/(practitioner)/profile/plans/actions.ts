"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPlanId } from "@/lib/subscriptions/contracts";
import { startCheckout } from "@/lib/subscriptions/functions";
import { createClient } from "@/lib/supabase/server";

export type CheckoutActionState = { message: string; status: "error" | "idle" };

/**
 * Where Paystack sends the practitioner back to: this site's confirm page, on the origin that
 * served the request. The checkout function accepts it only on an allow-listed origin.
 */
async function confirmUrl(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "nbacalculator.app";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/profile/plans/confirm`;
}

export async function startCheckoutAction(_previous: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  const plan = formData.get("plan");
  if (!isPlanId(plan)) return { message: "Choose a plan.", status: "error" };

  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return { message: "Your session expired. Log in again before subscribing.", status: "error" };

  const result = await startCheckout(client, plan, await confirmUrl());
  if (result.error !== null) return { message: result.error, status: "error" };

  // Not inside a try: redirect works by throwing.
  redirect(result.data.authorizationUrl);
}
