import "server-only";
import { afterCursorFilter, encodeCursor, PAGE_SIZE, pageOf, type Cursor } from "@/lib/paging";
import { loadPractitionerIdentity } from "@/lib/practitioner/identity";
import { requireSession } from "@/lib/supabase/request";
import { parseCertificate } from "./contracts";
import type { Certificate } from "./types";

const columns = "id, transaction_id, certificate_number, issued_at, revoked_at, revocation_reason, transactions!inner(user_id, status, rbin, parties, document_type, consideration, branches!transactions_branch_id_fkey(name, chairman_name, chairman_signature_url))";
const loadError = "Your certificates could not be loaded. Refresh the page and try again.";
const identityError = "Your practitioner details are unavailable. Contact your branch administrator.";
const readError = "A certificate could not be read. Please contact your branch administrator.";

export type CertificatePage = { certificates: Certificate[]; nextCursor: string | null; error: string | null };

type Row = Record<string, unknown> & { id?: unknown; issued_at?: unknown };

function cursorOf(row: Row): string | null {
  return typeof row.issued_at === "string" && typeof row.id === "string" ? encodeCursor(row.issued_at, row.id) : null;
}

function parseAll(rows: readonly Row[], identity: { name: string; scn: string }): Certificate[] | null {
  const certificates: Certificate[] = [];
  for (const row of rows) {
    const certificate = parseCertificate(row, identity);
    if (!certificate) return null;
    certificates.push(certificate);
  }
  return certificates;
}

/** One page of the practitioner's certificates, newest first. */
export async function loadCertificatePage(cursor: Cursor | null): Promise<CertificatePage> {
  const { client, user } = await requireSession("/certificates");
  try {
    // certificates has no owner column: ownership and verification are asserted through the transaction.
    let query = client.from("certificates").select(columns).eq("transactions.user_id", user.id).eq("transactions.status", "verified");
    if (cursor) query = query.or(afterCursorFilter("issued_at", cursor));
    const [result, identity] = await Promise.all([
      query.order("issued_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE + 1),
      loadPractitionerIdentity(user.id),
    ]);
    if (result.error) return { certificates: [], nextCursor: null, error: loadError };
    if (!result.data?.length) return { certificates: [], nextCursor: null, error: null };
    if (!identity.name || !identity.scn) return { certificates: [], nextCursor: null, error: identityError };
    const page = pageOf(result.data as Row[], cursorOf);
    const certificates = parseAll(page.rows, { name: identity.name, scn: identity.scn });
    return certificates ? { certificates, nextCursor: page.nextCursor, error: null } : { certificates: [], nextCursor: null, error: readError };
  } catch { return { certificates: [], nextCursor: null, error: loadError }; }
}

/** One of the practitioner's certificates, or null when it is not theirs or does not exist. */
export async function loadCertificate(id: string): Promise<{ certificate: Certificate | null; error: string | null }> {
  const { client, user } = await requireSession(`/certificates/${id}`);
  try {
    const [result, identity] = await Promise.all([
      client.from("certificates").select(columns).eq("id", id).eq("transactions.user_id", user.id).eq("transactions.status", "verified").maybeSingle(),
      loadPractitionerIdentity(user.id),
    ]);
    if (result.error) return { certificate: null, error: loadError };
    if (!result.data) return { certificate: null, error: null };
    if (!identity.name || !identity.scn) return { certificate: null, error: identityError };
    const certificates = parseAll([result.data as Row], { name: identity.name, scn: identity.scn });
    return certificates ? { certificate: certificates[0], error: null } : { certificate: null, error: readError };
  } catch { return { certificate: null, error: loadError }; }
}
