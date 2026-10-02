import { CertificatesList } from "@/components/certificates/certificates-list";
import { loadCertificatePage } from "@/lib/certificates/data";

export default async function CertificatesPage() {
  return <CertificatesList initial={await loadCertificatePage(null)}/>;
}
