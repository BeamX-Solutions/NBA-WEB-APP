import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who may use the practitioner app, mirroring the mobile root navigator.
 *
 * A branch administrator practises too and is treated as a member here; only a super administrator,
 * who belongs to no branch, is turned away.
 *
 * Navigation, not security: create_transaction and RLS refuse super administrators and unapproved
 * members whatever this decides.
 */
export type PractitionerAccess =
  | { kind: "practitioner" }
  | { kind: "administrator" }
  | { kind: "membership" }
  | { kind: "unavailable" };

export const MEMBERSHIP_PATH = "/membership";
export const ACCOUNT_UNAVAILABLE_PATH = "/account-unavailable";
/** Where a super administrator lands once their session has been ended. Public: it needs no session. */
export const ADMINISTRATOR_PATH = "/administrator-account";
/** The login page carrying mobile's refusal, which the administrator screen leads back to. */
export const ADMINISTRATOR_LOGIN_PATH = "/login?auth_error=administrator";

/** mobile lib/auth-context ADMIN_REJECTION. */
export const ADMINISTRATOR_REJECTION =
  "This is a super administrator account, which belongs to no branch. " +
  "Super administrators sign in on the web console.";

const administratorRoles = new Set(["super_admin"]);

type AccessRow = { role?: unknown; membership_status?: unknown };

export function accessFor(row: AccessRow | null): PractitionerAccess {
  if (!row) return { kind: "unavailable" };
  if (typeof row.role === "string" && administratorRoles.has(row.role)) return { kind: "administrator" };
  if (row.membership_status === "approved") return { kind: "practitioner" };
  if (row.membership_status === "pending" || row.membership_status === "rejected") return { kind: "membership" };
  return { kind: "unavailable" };
}

/**
 * Where a request for `pathname` should go instead, or null to let it through.
 * Super administrators are sent to their own page; the caller must end their session first.
 */
export function redirectFor(access: PractitionerAccess, pathname: string): string | null {
  if (access.kind === "administrator") return ADMINISTRATOR_PATH;
  if (access.kind === "membership") return pathname === MEMBERSHIP_PATH ? null : MEMBERSHIP_PATH;
  if (access.kind === "unavailable") return pathname === ACCOUNT_UNAVAILABLE_PATH ? null : ACCOUNT_UNAVAILABLE_PATH;
  const onGate = pathname === MEMBERSHIP_PATH || pathname === ACCOUNT_UNAVAILABLE_PATH;
  return onGate ? "/" : null;
}

export async function loadPractitionerAccess(client: SupabaseClient, userId: string): Promise<PractitionerAccess> {
  const { data, error } = await client.from("profiles").select("role, membership_status").eq("id", userId).maybeSingle();
  return error ? { kind: "unavailable" } : accessFor(data);
}
