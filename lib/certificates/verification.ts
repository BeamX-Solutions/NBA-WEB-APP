import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";
import { normalizeRbin, parseVerification } from "./contracts";
import type { VerificationRecord } from "./types";

export async function verifyCertificate(rbin: string): Promise<{ record: VerificationRecord | null; error: string | null }> {
  const normalized = normalizeRbin(rbin);
  if (!normalized) return { record: null, error: null };
  const unavailable = { record: null, error: "Certificate verification is unavailable. Refresh the page and try again." };
  try {
    const { url, key } = supabaseConfig();
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await client.rpc("verify_rbin", { p_rbin: normalized });
    if (error || !Array.isArray(data)) return unavailable;
    if (!data.length) return { record: null, error: null };
    if (data.length !== 1) return unavailable;
    const record = parseVerification(data[0]);
    return record ? { record, error: null } : unavailable;
  } catch { return unavailable; }
}
