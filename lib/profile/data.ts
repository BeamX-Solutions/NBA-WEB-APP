import "server-only";

import { requireSession } from "@/lib/supabase/request";
import { formatProfileDateTime } from "@/lib/profile/format";
import type { PractitionerProfile, PractitionerSubscription, ProfileLoadResult } from "@/lib/profile/types";

type UnknownRow = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function branchFrom(value: unknown): UnknownRow | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === "object" ? value[0] as UnknownRow : null;
  return value && typeof value === "object" ? value as UnknownRow : null;
}

function parseProfile(value: unknown, authEmail: string): PractitionerProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as UnknownRow;
  const id = asString(row.id);
  if (!id) return null;
  const branch = branchFrom(row.branches);
  return {
    avatarUrl: asNullableString(row.avatar_url),
    bankAccountName: asString(row.bank_account_name),
    bankAccountNumber: asString(row.bank_account_number),
    bankName: asString(row.bank_name),
    branchId: asNullableString(row.branch_id),
    branchName: branch ? asString(branch.name, "Branch unavailable") : "Branch unavailable",
    branchState: branch ? asNullableString(branch.state) : null,
    email: authEmail || asString(row.email, "Unavailable"),
    fullName: asString(row.full_name, "Practitioner"),
    id,
    phone: asString(row.phone),
    practiceState: asString(row.practice_state),
    role: asString(row.role, "individual"),
    scn: asString(row.scn, "Unavailable"),
  };
}

function parseSubscription(value: unknown): PractitionerSubscription | null {
  if (!value || typeof value !== "object") return null;
  const row = value as UnknownRow;
  const expiresAt = asString(row.expires_at);
  const startsAt = asString(row.starts_at);
  if (!expiresAt || !startsAt) return null;
  return {
    amount: asNumber(row.amount),
    expiresAt,
    isCurrent: asString(row.status) === "active" && new Date(expiresAt).getTime() > Date.now(),
    plan: asString(row.plan, "unknown"),
    rateType: asString(row.rate_type, "unknown"),
    startsAt,
    status: asString(row.status, "unknown"),
  };
}

export async function loadProfilePageData(nextPath: string): Promise<ProfileLoadResult> {
  const { client, user } = await requireSession(nextPath);

  const [profileResult, subscriptionResult] = await Promise.all([
    client
      .from("profiles")
      .select("id, full_name, email, phone, scn, branch_id, practice_state, role, avatar_url, bank_account_name, bank_account_number, bank_name, branches(name, state)")
      .eq("id", user.id)
      .maybeSingle(),
    client
      .from("subscriptions")
      .select("plan, rate_type, amount, starts_at, expires_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error || subscriptionResult.error) {
    return { data: null, error: "Your profile could not be loaded. Refresh the page and try again." };
  }

  const profile = parseProfile(profileResult.data, user.email ?? "");
  if (!profile) return { data: null, error: "Your practitioner profile is not available. Contact your branch administrator." };

  return {
    data: {
      account: {
        email: user.email ?? profile.email,
        lastSignedIn: formatProfileDateTime(user.last_sign_in_at),
      },
      profile,
      subscription: parseSubscription(subscriptionResult.data),
    },
    error: null,
  };
}

/** Security only shows how the practitioner signs in, which the session already holds: no database read. */
export async function loadAccount(): Promise<{ email: string; lastSignedIn: string }> {
  const { user } = await requireSession("/profile/security");
  return { email: user.email ?? "Unavailable", lastSignedIn: formatProfileDateTime(user.last_sign_in_at) };
}
