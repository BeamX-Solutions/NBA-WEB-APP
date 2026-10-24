/**
 * What the subscription Edge Functions answer, read defensively.
 *
 * The functions live in NBA APP supabase/functions: subscription-checkout starts a Paystack
 * checkout, subscription-confirm asks Paystack whether it was paid. The price and the grant are
 * the database's; nothing here decides either.
 */

export type PlanId = "monthly" | "quarterly" | "yearly";

const PLAN_IDS: readonly PlanId[] = ["monthly", "quarterly", "yearly"];

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export type Checkout = { authorizationUrl: string; reference: string };

export function parseCheckout(value: unknown): Checkout | null {
  if (!value || typeof value !== "object") return null;
  const { authorizationUrl, reference } = value as Record<string, unknown>;
  if (typeof authorizationUrl !== "string" || typeof reference !== "string") return null;
  // Only ever send the practitioner on to Paystack.
  try {
    if (new URL(authorizationUrl).hostname !== "checkout.paystack.com") return null;
  } catch {
    return null;
  }
  return { authorizationUrl, reference };
}

export type Confirmation =
  | { status: "active"; expiresAt: string }
  | { status: "pending" }
  | { status: "failed" };

export function parseConfirmation(value: unknown): Confirmation | null {
  if (!value || typeof value !== "object") return null;
  const { status, expiresAt } = value as Record<string, unknown>;
  if (status === "active") return typeof expiresAt === "string" ? { status, expiresAt } : null;
  if (status === "pending" || status === "failed") return { status };
  return null;
}

/** Paystack returns the reference twice, as reference and trxref. */
export function referenceFrom(params: { reference?: string | string[]; trxref?: string | string[] }): string | null {
  const raw = params.reference ?? params.trxref;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && /^[A-Za-z0-9.=-]{1,100}$/.test(value) ? value : null;
}
