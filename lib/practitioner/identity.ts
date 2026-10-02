import "server-only";
import { cache } from "react";
import { getServerClient } from "@/lib/supabase/request";
import { asRow, text } from "@/lib/transactions/contracts";

/** The practitioner's name and SCN as printed on their records, or null when they are missing. */
export type PractitionerIdentity = { name: string | null; scn: string | null };

/**
 * Read once per request: transactions, invoices and certificates all print the practitioner's name
 * and SCN, and a page may load more than one of them. Throws when the read fails, so a loader can
 * report its own error.
 */
export const loadPractitionerIdentity = cache(async (userId: string): Promise<PractitionerIdentity> => {
  const client = await getServerClient();
  const { data, error } = await client.from("profiles").select("full_name, scn").eq("id", userId).maybeSingle();
  if (error) throw new Error("profile read failed");
  const profile = asRow(data);
  return { name: text(profile?.full_name), scn: text(profile?.scn) };
});
