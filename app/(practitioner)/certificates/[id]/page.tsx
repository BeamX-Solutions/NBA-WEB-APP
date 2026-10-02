import { notFound } from "next/navigation";
import { CertificateDetail } from "@/components/certificates/certificate-detail";
import { ButtonLink } from "@/components/mobile/button";
import { Screen } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";
import { isUuid } from "@/lib/calculator/contracts";
import { verificationUrlFor } from "@/lib/certificates/contracts";
import { loadCertificate } from "@/lib/certificates/data";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const result = await loadCertificate(id);
  if (result.error) return <><Screen><ErrorState action={<ButtonLink href="/certificates" variant="outline">My Certificates</ButtonLink>} body={result.error} title="This certificate could not be loaded"/></Screen></>;
  const certificate = result.certificate;
  if (!certificate) notFound();
  return <><CertificateDetail certificate={certificate} verificationUrl={verificationUrlFor(certificate.rbin)}/></>;
}
