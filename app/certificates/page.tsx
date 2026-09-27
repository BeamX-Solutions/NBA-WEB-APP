import { CertificatesList } from "@/components/certificates/certificates-list";
import { loadCertificates } from "@/lib/certificates/data";

export default async function CertificatesPage() {
  const result = await loadCertificates();
  return <CertificatesList certificates={result.certificates} error={result.error}/>;
}
