import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who may use the practitioner app, mirroring the mobile root navigator.
 *
 * Navigation, not security: create_transaction and RLS refuse administrators and
 * unapproved members whatever this decides.
 */
export type PractitionerAccess =
  | { kind: "practitioner" }
  | { kind: "administrator" }
  | { kind: "membership" }
  | { kind: "unavailable" };

export const ADMINISTRATOR_PATH = "/administrator-account";
export const MEMBERSHIP_PATH = "/membership";

const administratorRoles = new Set(["branch_admin", "super_admin"]);

type AccessRow = { role?: unknown; membership_status?: unknown };

export function accessFor(row: AccessRow | null): PractitionerAccess {
  if (!row) return { kind: "unavailable" };
  if (typeof row.role === "string" && administratorRoles.has(row.role)) return { kind: "administrator" };
  if (row.membership_status === "approved") return { kind: "practitioner" };
  if (row.membership_status === "pending" || row.membership_status === "rejected") return { kind: "membership" };
  return { kind: "unavailable" };
}

/** Where a request for `pathname` should go instead, or null to let it through. */
export function redirectFor(access: PractitionerAccess, pathname: string): string | null {
  const onGate = pathname === ADMINISTRATOR_PATH || pathname === MEMBERSHIP_PATH;
  if (access.kind === "administrator") return pathname === ADMINISTRATOR_PATH ? null : ADMINISTRATOR_PATH;
  if (access.kind === "membership") return pathname === MEMBERSHIP_PATH ? null : MEMBERSHIP_PATH;
  if (access.kind === "practitioner" && onGate) return "/";
  return null;
}

export async function loadPractitionerAccess(client: SupabaseClient, userId: string): Promise<PractitionerAccess> {
  const { data, error } = await client.from("profiles").select("role, membership_status").eq("id", userId).maybeSingle();
  return error ? { kind: "unavailable" } : accessFor(data);
}
