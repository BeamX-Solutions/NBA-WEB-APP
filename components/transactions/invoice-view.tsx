"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { DetailList, DetailRow, Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { Notice, type NoticeTone } from "@/components/mobile/states";
import { PRODUCT_NAME } from "@/lib/branding";
import { invoiceShareText, type InvoiceRecord } from "@/lib/transactions/invoice";
import { useOnline } from "@/lib/use-online";

type Status = { message: string; tone: NoticeTone } | null;

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return <div className="flex items-center gap-3 border-b border-border py-3">
    <div className="min-w-0 flex-1"><p className="text-caption tracking-[0.5px] text-text-muted uppercase">{label}</p><p className="mt-[2px] wrap-break-word text-body font-semibold text-text">{value}</p></div>
    <button aria-label={copied ? `${label} copied` : `Copy ${label}`} className="grid size-9 shrink-0 place-items-center rounded-full border-0 bg-surface-muted" onClick={onCopy} type="button"><Icon color={copied ? "var(--color-primary)" : "var(--color-text-muted)"} name={copied ? "check" : "content-copy"} size={18}/></button>
  </div>;
}

function AmberNote({ icon, children }: { icon: string; children: string }) {
  return <div className="mt-3 flex gap-2 rounded-input bg-accent-surface p-3 text-accent-text"><Icon name={icon} size={18}/><p className="flex-1 text-caption leading-[17px]">{children}</p></div>;
}

/** mobile transaction/invoice/[id]: the client's bill and the branch account it is paid into. */
export function InvoiceView({ invoice }: { invoice: InvoiceRecord }) {
  const online = useOnline();
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const timer = useRef<number | undefined>(undefined);
  const { branch } = invoice;
  const hasAccount = Boolean(branch.accountName && branch.accountNumber && branch.bankName);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setStatus({ message: `${label} could not be copied. Select it and copy it manually.`, tone: "error" });
    }
  }

  async function share() {
    const message = invoiceShareText(invoice);
    setStatus(null);
    if (typeof navigator.share === "function") {
      try { await navigator.share({ text: message, title: `Invoice ${invoice.invoiceNumber}` }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(message);
      setStatus({ message: "Payment instructions copied. Paste them into a message to your client.", tone: "success" });
    } catch {
      setStatus({ message: "The invoice could not be shared from this browser. Download the PDF and send that instead.", tone: "error" });
    }
  }

  return <Screen>
    <ScreenHeading subtitle="Your client pays this into the branch account. Upload their payment slip once they have paid." title="Invoice"/>
    <Card>
      <div className="flex items-center gap-3 border-b border-border pb-3"><Image alt="" className="size-11 object-contain" height={44} src="/nba-seal.png" width={44}/><div className="flex-1"><p className="text-body-lg font-bold text-primary-text">{branch.name}</p><p className="text-caption text-text-muted">{PRODUCT_NAME}</p></div></div>
      <DetailList>
        <DetailRow emphasise label="Legal Practitioner" value={invoice.practitioner}/>
        <DetailRow emphasise label="Reference" value={invoice.invoiceNumber}/>
        <DetailRow label="Document Type" value={invoice.documentType}/>
        <DetailRow label="Parties" value={invoice.parties}/>
        <DetailRow label="Date" value={invoice.issuedAt}/>
      </DetailList>
      <div className="flex flex-col items-center py-4 text-center"><p className="text-caption tracking-[0.5px] text-text-muted">REMUNERATION</p><p className="mt-1 text-[34px] leading-tight font-bold text-primary">{invoice.amountPayable}</p><p className="mt-1 text-caption text-text-muted">Paid by the client into the branch account. The branch keeps {invoice.branchFee} and sends you {invoice.dueToPractitioner}.</p></div>
    </Card>
    <Card className="mt-4">
      <SectionTitle icon="account-balance" underline>Pay into this account</SectionTitle>
      {hasAccount ? <>
        <CopyRow copied={copied === "Account Name"} label="Account Name" onCopy={() => copy("Account Name", branch.accountName ?? "")} value={branch.accountName ?? ""}/>
        <CopyRow copied={copied === "Account Number"} label="Account Number" onCopy={() => copy("Account Number", branch.accountNumber ?? "")} value={branch.accountNumber ?? ""}/>
        <CopyRow copied={copied === "Bank"} label="Bank" onCopy={() => copy("Bank", branch.bankName ?? "")} value={branch.bankName ?? ""}/>
        <CopyRow copied={copied === "Reference"} label="Use this reference" onCopy={() => copy("Reference", invoice.invoiceNumber)} value={invoice.invoiceNumber}/>
        <AmberNote icon="info-outline">Your client should quote the reference on their transfer. Without it the branch may not be able to match the payment to this transaction.</AmberNote>
      </> : <AmberNote icon="warning-amber">Your branch has not published its bank details yet. Contact the branch secretariat for payment instructions before uploading proof.</AmberNote>}
    </Card>
    <div className="mt-4"><ButtonLink href={`/transactions/${invoice.id}`}>{invoice.canSubmitProof ? "My client has paid, upload proof" : "View transaction"}</ButtonLink></div>
    <div className="mt-2">{online ? <ButtonLink download external href={`/transactions/${invoice.id}/invoice/pdf`} variant="outline">Download PDF</ButtonLink> : <Button disabled variant="outline">Offline: reconnect to download</Button>}</div>
    <div className="mt-2"><Button onClick={share} variant="outline">Share invoice</Button></div>
    {status ? <Notice className="mt-3" tone={status.tone}>{status.message}</Notice> : null}
  </Screen>;
}
