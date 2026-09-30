import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asRow, text } from "@/lib/transactions/contracts";
import { parseCertificate } from "./contracts";
import type { Certificate } from "./types";

const columns = "id, transaction_id, certificate_number, issued_at, revoked_at, revocation_reason, transactions!inner(user_id, status, rbin, parties, document_type, consideration, branches!transactions_branch_id_fkey(name, chairman_name, chairman_signature_url))";
const loadError = "Your certificates could not be loaded. Refresh the page and try again.";

export async function loadCertificates(id?: string): Promise<{ certificates: Certificate[]; error: string | null }> {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect(`/login?next=${encodeURIComponent(id ? `/certificates/${id}` : "/certificates")}`);
  try {
    let query = client.from("certificates").select(columns).eq("transactions.user_id", user.id).eq("transactions.status", "verified").order("issued_at", { ascending: false });
    if (id) query = query.eq("id", id);
    const [result, profileResult] = await Promise.all([
      query,
      client.from("profiles").select("full_name, scn").eq("id", user.id).maybeSingle(),
    ]);
    if (result.error || profileResult.error) return { certificates: [], error: loadError };
    if (!result.data?.length) return { certificates: [], error: null };
    const profile = asRow(profileResult.data);
    const name = text(profile?.full_name);
    const scn = text(profile?.scn);
    if (!name || !scn) return { certificates: [], error: "Your practitioner details are unavailable. Contact your branch administrator." };
    const certificates: Certificate[] = [];
    for (const row of result.data) {
      const certificate = parseCertificate(row, { name, scn });
      if (!certificate) return { certificates: [], error: "A certificate could not be read. Please contact your branch administrator." };
      certificates.push(certificate);
    }
    return { certificates, error: null };
  } catch { return { certificates: [], error: loadError }; }
}
