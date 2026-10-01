import { AppShell } from "@/components/mobile/app-shell";
import { ButtonLink } from "@/components/mobile/button";
import { Screen } from "@/components/mobile/screen";
import { EmptyState } from "@/components/mobile/states";

export default function CertificateNotFound() {
  return <AppShell><Screen><EmptyState action={<ButtonLink href="/certificates" variant="outline">My Certificates</ButtonLink>} body="This certificate is unavailable or does not belong to your account." icon="gpp-bad" title="Certificate not found"/></Screen></AppShell>;
}
