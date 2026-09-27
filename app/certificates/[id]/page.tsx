import { notFound } from "next/navigation";
import { CertificateDetail } from "@/components/certificates/certificate-detail";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { FormNotice } from "@/components/ui/form-notice";
import { isUuid } from "@/lib/calculator/contracts";
import { loadCertificates } from "@/lib/certificates/data";
import { certificatePdfLocation } from "@/lib/certificates/contracts";
import { supabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const result = await loadCertificates(id);
  if (result.error) return <TransactionShell><main className="mx-auto max-w-[900px] p-4"><FormNotice tone="error">{result.error}</FormNotice><Link className="mt-6 inline-block text-sm font-semibold text-[#0d5b38]" href="/certificates">← My Certificates</Link></main></TransactionShell>;
  const certificate = result.certificates[0];
  if (!certificate) notFound();
  const pdfAvailable = !certificate.revoked && certificatePdfLocation(certificate.pdfUrl, supabaseConfig().url) !== null;
  return <CertificateDetail certificate={certificate} pdfAvailable={pdfAvailable}/>;
}
