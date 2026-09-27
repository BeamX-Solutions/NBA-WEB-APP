import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CalculatorBranch, CalculatorContext, CalculatorSubscription } from "@/lib/calculator/types";

type UnknownRow = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asRow(value: unknown): UnknownRow | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === "object" ? value[0] as UnknownRow : null;
  return value && typeof value === "object" ? value as UnknownRow : null;
}

function parseBranch(value: unknown): CalculatorBranch | null {
  const row = asRow(value);
  if (!row) return null;
  const name = asString(row.name);
  if (!name) return null;
  return {
    accountName: asNullableString(row.account_name),
    accountNumber: asNullableString(row.account_number),
    activationStatus: asString(row.activation_status, "unknown"),
    bankName: asNullableString(row.bank_name),
    name,
    state: asNullableString(row.state),
  };
}

function parseSubscription(value: unknown): CalculatorSubscription | null {
  const row = asRow(value);
  if (!row) return null;
  const expiresAt = asString(row.expires_at);
  const startsAt = asString(row.starts_at);
  const status = asString(row.status, "unknown");
  if (!expiresAt || !startsAt) return null;
  const now = Date.now();
  return {
    expiresAt,
    isCurrent:
      status === "active" &&
      new Date(startsAt).getTime() <= now &&
      new Date(expiresAt).getTime() > now,
    plan: asString(row.plan, "unknown"),
    startsAt,
    status,
  };
}

function displayNames(fullName: string): Pick<CalculatorContext, "displayName" | "firstName"> {
  const displayName = fullName.trim() || "Practitioner";
  return { displayName, firstName: displayName.split(/\s+/)[0] || "Practitioner" };
}

export async function loadCalculatorContext(): Promise<CalculatorContext> {
  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) redirect("/login?next=%2F");

  const [profileResult, subscriptionResult] = await Promise.all([
    client
      .from("profiles")
      .select("full_name, scn, branch_id, branches(name, state, activation_status, account_name, account_number, bank_name)")
      .eq("id", user.id)
      .maybeSingle(),
    client
      .from("subscriptions")
      .select("plan, starts_at, expires_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error || subscriptionResult.error) {
    return {
      branch: null,
      scn: null,
      ...displayNames("Practitioner"),
      loadWarning: "Your account details could not be loaded. Fee calculation is still available, but invoice creation may not work until you refresh.",
      subscription: null,
    };
  }

  const profile = asRow(profileResult.data);
  if (!profile) {
    return {
      branch: null,
      scn: null,
      ...displayNames("Practitioner"),
      loadWarning: "Your practitioner profile is not available. Contact your branch administrator. Fee calculation remains available.",
      subscription: null,
    };
  }

  const branch = parseBranch(profile.branches);
  return {
    branch,
    scn: asNullableString(profile.scn),
    ...displayNames(asString(profile.full_name)),
    loadWarning: branch ? null : "Your branch details are unavailable. Fee calculation remains available, but an invoice cannot be created yet.",
    subscription: parseSubscription(subscriptionResult.data),
  };
}
