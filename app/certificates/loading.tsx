import { AppShell } from "@/components/mobile/app-shell";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { LoadingState } from "@/components/mobile/states";

export default function CertificatesLoading() {
  return <AppShell tabs><Screen wide><ScreenHeading subtitle="View and download your official Certificates of Compliance." title="My Certificates"/><LoadingState label="Loading your certificates"/></Screen></AppShell>;
}
