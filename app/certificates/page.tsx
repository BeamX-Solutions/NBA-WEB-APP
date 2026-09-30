import { CertificatesList } from "@/components/certificates/certificates-list";
import { AppShell } from "@/components/mobile/app-shell";
import { loadCertificates } from "@/lib/certificates/data";

export default async function CertificatesPage() {
  const result = await loadCertificates();
  return <AppShell tabs><CertificatesList certificates={result.certificates} error={result.error}/></AppShell>;
}
