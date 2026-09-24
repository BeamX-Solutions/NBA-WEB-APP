import { notFound } from "next/navigation";
import { CertificateDetail } from "@/components/certificates/certificate-detail";
import { findSampleCertificate } from "@/lib/certificates/sample-certificates";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = findSampleCertificate(id);
  if (!certificate) notFound();
  return <CertificateDetail certificate={certificate} />;
}
