import { redirect } from "next/navigation";
import { AppShell } from "@/components/mobile/app-shell";
import { VerifyView } from "@/components/verify/verify-view";
import { normalizeRbin, verificationPath } from "@/lib/certificates/contracts";

/** The typed-in form. Submitting sends ?rbin=..., which moves to the same URL a QR code carries. */
export default async function VerifyFormPage({ searchParams }: { searchParams: Promise<{ rbin?: string | string[] }> }) {
  const { rbin } = await searchParams;
  const typed = typeof rbin === "string" ? rbin : "";
  const reference = normalizeRbin(typed);
  if (reference) redirect(verificationPath(reference));
  return <AppShell><VerifyView initial={typed} outcome={typed.trim() ? { kind: "notFound" } : { kind: "idle" }}/></AppShell>;
}
