import { isUuid } from "@/lib/calculator/contracts";
import { verificationUrlFor } from "@/lib/certificates/contracts";
import { loadCertificates } from "@/lib/certificates/data";
import { loadPdfAssets } from "@/lib/pdf/assets";
import { createCertificatePdf } from "@/lib/pdf/certificate-pdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };
const maxSignatureBytes = 2 * 1024 * 1024;

function failure(status: number) {
  return Response.json({ error: "The certificate PDF is unavailable." }, { status, headers });
}

/**
 * The branch chairman's signature from the private bucket, read with the practitioner's own session.
 * Null on any failure: a missing signature must never stop a certificate being produced.
 */
async function loadSignature(path: string | null): Promise<Uint8Array | null> {
  if (!path) return null;
  try {
    const client = await createClient();
    const { data, error } = await client.storage.from("signatures").download(path);
    if (error || !data || data.size > maxSignatureBytes) return null;
    return new Uint8Array(await data.arrayBuffer());
  } catch {
    return null;
  }
}

/** Generated from the database each time, as mobile does. A revoked certificate is stamped REVOKED. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return failure(404);
  const result = await loadCertificates(id);
  if (result.error) return failure(503);
  const certificate = result.certificates[0];
  if (!certificate) return failure(404);
  try {
    const [signature, assets] = await Promise.all([loadSignature(certificate.chairmanSignaturePath), loadPdfAssets()]);
    const pdf = await createCertificatePdf({
      practitioner: certificate.practitioner, rbin: certificate.rbin, scn: certificate.scn, parties: certificate.parties,
      documentType: certificate.documentType, consideration: certificate.consideration, certificateNumber: certificate.certificateNumber,
      issuedOn: certificate.issuedOn, branch: certificate.branch, chairman: certificate.chairman === "Unavailable" ? null : certificate.chairman,
      signature, revoked: certificate.revoked, verificationUrl: verificationUrlFor(certificate.rbin),
    }, assets);
    const filename = `certificate-${certificate.certificateNumber.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`;
    return new Response(pdf, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "X-Content-Type-Options": "nosniff" } });
  } catch {
    return failure(500);
  }
}
