import { CertificatesList } from "@/components/certificates/certificates-list";
export default function CertificatesLoading() {
  return <CertificatesList certificates={[]} error={null} loading/>;
}
