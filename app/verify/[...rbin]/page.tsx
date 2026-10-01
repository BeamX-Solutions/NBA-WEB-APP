import { AppShell } from "@/components/mobile/app-shell";
import { VerifyView, type VerifyOutcome } from "@/components/verify/verify-view";
import { rbinFromSegments } from "@/lib/certificates/contracts";
import { verifyCertificate } from "@/lib/certificates/verification";

export const dynamic = "force-dynamic";

/** Both /verify/NBA%2F2026%2F00001 (what QR codes carry) and /verify/NBA/2026/00001 resolve here. */
export default async function VerificationPage({ params }: { params: Promise<{ rbin: string[] }> }) {
  const { rbin } = await params;
  const reference = rbinFromSegments(rbin);
  if (!reference) return <AppShell><VerifyView initial={rbin.join("/")} outcome={{ kind: "notFound" }}/></AppShell>;
  const { record, error } = await verifyCertificate(reference);
  const outcome: VerifyOutcome = error ? { kind: "error" } : record ? { kind: "found", record } : { kind: "notFound" };
  return <AppShell><VerifyView initial={reference} outcome={outcome}/></AppShell>;
}
