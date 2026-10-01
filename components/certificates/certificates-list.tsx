"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/mobile/badge";
import { Button, ButtonLink } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { EmptyState, ErrorState, Notice, type NoticeTone } from "@/components/mobile/states";
import { verificationUrlFor } from "@/lib/certificates/contracts";
import type { Certificate } from "@/lib/certificates/types";

type ViewMode = "grid" | "list";

const heading = <ScreenHeading subtitle="View and download your official Certificates of Compliance." title="My Certificates"/>;

function ViewModeOption({ icon, label, onSelect, selected }: { icon: string; label: string; onSelect: () => void; selected: boolean }) {
  return <button aria-pressed={selected} className={`flex items-center gap-1 rounded-[6px] border-0 px-3 py-2 text-label ${selected ? "bg-surface font-semibold text-text" : "bg-transparent text-text-muted"}`} onClick={onSelect} type="button"><Icon name={icon} size={18}/>{label}</button>;
}

function CertificateCard({ certificate, compact, onShare }: { certificate: Certificate; compact: boolean; onShare: (certificate: Certificate) => void }) {
  const revoked = certificate.revoked;
  return <Card>
    {!compact ? <div className={`relative mb-3 flex h-[150px] flex-col items-center justify-center gap-2 overflow-hidden rounded-input ${revoked ? "bg-danger-surface" : "bg-success-surface"}`}>
      <Icon color={revoked ? "var(--color-danger)" : "var(--color-primary)"} name={revoked ? "gpp-bad" : "workspace-premium"} size={40}/>
      <span className={`text-caption font-semibold ${revoked ? "text-danger" : "text-primary-text"}`}>Certificate of Compliance</span>
      <span className="absolute right-2 bottom-2 rounded-full bg-text px-2 py-[2px] text-[10px] font-bold tracking-[0.5px] text-text-inverse">{revoked ? "REVOKED" : "VALID"}</span>
    </div> : null}
    <div className="mb-3 flex justify-between"><Badge className="bg-surface-muted text-text-muted" label={certificate.year}/>{revoked ? <Badge className="bg-danger-surface text-danger" label="Revoked"/> : <Badge label="Official Issue"/>}</div>
    <h2 className="m-0 text-title font-bold text-text">Certificate of Compliance</h2>
    {!compact ? <p className="mt-1 text-label text-text-muted">{certificate.documentType}</p> : null}
    <dl className="my-3 flex gap-4 rounded-input bg-surface-muted p-3">
      <div className="min-w-0 flex-1"><dt className="text-caption text-text-muted">RBIN</dt><dd className="mt-1 break-all text-label font-semibold text-primary">{certificate.rbin}</dd></div>
      <div className="flex-1"><dt className="text-caption text-text-muted">Date Issued</dt><dd className="mt-1 text-label font-semibold text-primary">{certificate.issuedAt}</dd></div>
    </dl>
    <div className="flex items-center gap-2">
      <ButtonLink className="flex-1" href={`/certificates/${certificate.id}`}>View Certificate</ButtonLink>
      <button aria-label={`Share certificate ${certificate.rbin}`} className="grid size-12 shrink-0 place-items-center rounded-button border-[1.5px] border-border bg-surface text-primary" onClick={() => onShare(certificate)} type="button"><Icon name="share" size={20}/></button>
    </div>
  </Card>;
}

/** mobile (tabs)/certificates. Cards become a two-column grid from 800px in grid view. */
export function CertificatesList({ certificates, error }: { certificates: Certificate[]; error: string | null }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [status, setStatus] = useState<{ message: string; tone: NoticeTone } | null>(null);

  async function share(certificate: Certificate) {
    const url = verificationUrlFor(certificate.rbin);
    const text = `NBA Certificate of Compliance ${certificate.certificateNumber}, RBIN ${certificate.rbin}.`;
    setStatus(null);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Certificate verification", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} Verify at ${url}`);
      setStatus({ message: "Verification link copied.", tone: "success" });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setStatus({ message: "Could not share the verification link. Please try again.", tone: "error" });
    }
  }

  if (error) return <Screen wide>{heading}<ErrorState action={<Button onClick={() => router.refresh()} variant="outline">Try again</Button>} body={error}/></Screen>;

  if (!certificates.length) {
    return <Screen wide>{heading}<EmptyState action={<ButtonLink href="/transactions">View transactions</ButtonLink>} body="A Certificate of Compliance is issued once your branch verifies your client's payment. Upload the payment slip on a transaction to start that process." icon="verified" title="No certificates yet"/></Screen>;
  }

  return <Screen wide>
    {heading}
    <div aria-label="Certificate display" className="mb-4 inline-flex gap-1 rounded-input bg-surface-muted p-1" role="group">
      <ViewModeOption icon="grid-view" label="Grid" onSelect={() => setViewMode("grid")} selected={viewMode === "grid"}/>
      <ViewModeOption icon="view-list" label="List" onSelect={() => setViewMode("list")} selected={viewMode === "list"}/>
    </div>
    <div className={`grid gap-3 ${viewMode === "grid" ? "min-[800px]:grid-cols-2" : ""}`}>{certificates.map((certificate) => <CertificateCard certificate={certificate} compact={viewMode === "list"} key={certificate.id} onShare={share}/>)}</div>
    {status ? <Notice className="mt-3" tone={status.tone}>{status.message}</Notice> : null}
    <div className="mt-2 flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong p-4 text-center">
      <Icon color="var(--color-text-muted)" name="history" size={26}/>
      <p className="text-label text-text-muted">Looking for older certificates? Request archive access.</p>
      <Link className="text-label font-bold text-primary" href="/profile/help">Request Archive</Link>
    </div>
  </Screen>;
}
