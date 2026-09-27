import { isUuid } from "@/lib/calculator/contracts";
import { loadCertificates } from "@/lib/certificates/data";
import { certificatePdfLocation } from "@/lib/certificates/contracts";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";

const headers = { "Cache-Control": "private, no-store" };
function failure(status: number) {
  return Response.json({ error: "The certificate PDF is unavailable." }, { status, headers });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return failure(404);
  const result = await loadCertificates(id);
  if (result.error) return failure(503);
  const certificate = result.certificates[0];
  if (!certificate) return failure(404);
  if (certificate.revoked) return failure(409);
  const location = certificatePdfLocation(certificate.pdfUrl, supabaseConfig().url);
  if (!location) return failure(404);
  try {
    const client = await createClient();
    const { data, error } = await client.storage.from(location.bucket).download(location.path);
    if (error || !data) return failure(503);
    const signature = await data.slice(0, 5).text();
    if (signature !== "%PDF-") return failure(503);
    return new Response(data, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="certificate-${id}.pdf"`, "X-Content-Type-Options": "nosniff" } });
  } catch { return failure(503); }
}
