"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { StatusBadge } from "@/components/mobile/badge";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { ConfirmDialog } from "@/components/mobile/confirm-dialog";
import { Icon } from "@/components/mobile/icon";
import { DetailList, DetailRow, Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { Stepper } from "@/components/mobile/stepper";
import { validateProof } from "@/lib/preview/documents";
import type { TransactionRecord } from "@/lib/transactions/contracts";

const PROOF_STEPS = ["Invoice", "Proof of payment", "Verified"];

function ProofPicker({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [requiresRefresh, setRequiresRefresh] = useState(false);
  const submitting = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    if (submitting.current) return;
    const selected = event.target.files?.[0];
    setMessage("");
    if (!selected) return;
    const validationError = validateProof(selected);
    setError(validationError ?? "");
    setFile(validationError ? null : selected);
  }

  function removeFile() {
    if (submitting.current) return;
    setFile(null);
    setError("");
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!file || submitting.current || requiresRefresh) return;
    submitting.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.set("proof", file);
      const response = await fetch(`/transactions/${transactionId}/proof`, { method: "POST", body: form });
      const result: unknown = await response.json();
      const text = result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : "Submission could not be confirmed. Refresh before trying again.";
      if (!response.ok) { setError(text); setRequiresRefresh(response.status >= 409); return; }
      setMessage(text);
      setRequiresRefresh(true);
      router.refresh();
    } catch {
      setError("Submission could not be confirmed. Refresh the transaction before trying again.");
      setRequiresRefresh(true);
    } finally { submitting.current = false; setPending(false); setConfirming(false); }
  }

  return <Card className="mb-4">
    <SectionTitle>Upload Proof of Payment</SectionTitle>
    <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="peer sr-only" disabled={pending || requiresRefresh} id="proof-file" onChange={chooseFile} ref={inputRef} type="file"/>
    <label className="flex cursor-pointer flex-col items-center rounded-card border-[1.5px] border-dashed border-border-strong bg-surface-muted py-6 text-center peer-focus-visible:outline-3 peer-focus-visible:outline-primary/35" htmlFor="proof-file">
      <span className="mb-3 grid size-[52px] place-items-center rounded-card bg-border text-text-muted"><Icon name="upload-file" size={26}/></span>
      <span className="text-body font-semibold text-text">Tap or click to browse files</span>
      <span className="mt-1 text-caption text-text-muted">Supported formats: PDF, JPG, PNG (max 10MB)</span>
      <span className="mt-3 rounded-button border border-border-strong bg-surface px-4 py-2 text-label font-semibold text-text">Select File</span>
    </label>
    {file ? <div className="mt-3 flex items-center justify-between gap-3 rounded-input bg-surface-muted p-3"><span className="min-w-0 flex-1 truncate text-label text-text">{file.name}</span><button className="border-0 bg-transparent text-label font-semibold text-danger" disabled={pending || requiresRefresh} onClick={removeFile} type="button">Remove</button></div> : null}
    {error ? <p className="mt-3 text-label text-danger" role="alert">{error}</p> : null}
    <div className="mt-4"><Button disabled={!file || requiresRefresh} loading={pending} onClick={() => setConfirming(true)}>Submit for Verification</Button></div>
    {requiresRefresh ? <button className="mt-3 w-full border-0 bg-transparent text-label font-semibold text-primary underline" onClick={() => window.location.reload()} type="button">Refresh transaction</button> : null}
    {message ? <p className="mt-3 text-label text-primary" role="status">{message}</p> : null}
    {confirming ? <ConfirmDialog body="Your branch will review this proof of payment. You will not be able to change the transaction or replace the file while it is under review." busy={pending} cancelLabel="Keep editing" confirmLabel="Submit" onCancel={() => setConfirming(false)} onConfirm={submit} title="Submit for verification?"/> : null}
  </Card>;
}

/** The branch sending on the practitioner's share, once the client's payment is verified. */
function ShareCard({ transaction }: { transaction: TransactionRecord }) {
  const { remittance } = transaction;
  return <Card className="mb-4">
    <SectionTitle icon="account-balance-wallet">Your share</SectionTitle>
    {remittance ? <DetailList><DetailRow emphasise label="Sent to you" value={remittance.remittedOn}/><DetailRow label="Account" value={remittance.account}/>{remittance.reference ? <DetailRow label="Transfer reference" value={remittance.reference}/> : null}</DetailList>
      : <p className="text-body leading-[21px] text-text-muted">The branch has verified your client&apos;s payment and will send {transaction.dueToPractitioner} to the account in your profile. This shows the date once they record the transfer.</p>}
  </Card>;
}

/** mobile transaction/[id]. */
export function TransactionDetail({ transaction }: { transaction: TransactionRecord }) {
  const { status } = transaction;
  const canSubmitProof = status === "awaiting" || status === "rejected";
  return <Screen>
    <ScreenHeading subtitle="Submit your client's payment slip for the branch to verify." title="Upload Proof"/>
    <Stepper current={status === "verified" ? 3 : 2} labels={PROOF_STEPS}/>
    <div className="mb-3"><StatusBadge status={status}/></div>
    {status === "rejected" ? <div className="mb-4 rounded-card border border-danger bg-danger-surface p-4"><p className="mb-1 text-label font-bold text-danger">Rejected by your branch</p><p className="text-body leading-[21px] text-danger">{transaction.rejectionReason ?? "No reason was recorded."}</p></div> : null}
    <Card className="mb-4">
      <SectionTitle>Transaction</SectionTitle>
      <DetailList>
        <DetailRow label="Invoice Number" value={transaction.invoiceNumber}/>
        <DetailRow label="Name of Practitioner" value={transaction.practitioner}/>
        <DetailRow label="Supreme Court Number" value={transaction.scn}/>
        <DetailRow label="Parties to the Document" value={transaction.parties}/>
        <DetailRow label="Type of Document" value={transaction.documentType}/>
        <DetailRow label="Consideration" value={transaction.consideration}/>
        <DetailRow emphasise label="Client pays into branch account" value={transaction.amountPayable}/>
        <DetailRow label="Less branch fee" value={transaction.branchFee}/>
        <DetailRow label="Branch sends to you" value={transaction.dueToPractitioner}/>
        {transaction.rbin ? <DetailRow label="RBIN" value={transaction.rbin}/> : null}
      </DetailList>
    </Card>
    {status === "verified" && transaction.hasDueToPractitioner ? <ShareCard transaction={transaction}/> : null}
    {canSubmitProof ? <>
      <Link className="mb-4 flex items-center gap-2 text-label font-semibold text-primary" href={`/transactions/${transaction.id}/invoice`}><Icon name="receipt-long" size={18}/>View invoice and payment details</Link>
      <ProofPicker transactionId={transaction.id}/>
    </> : <Card><p className="text-body leading-[22px] text-text-muted">{status === "pending" ? "Your proof of payment is with your branch for verification. You will be notified once it is reviewed." : "This transaction has been verified. Your Certificate of Compliance is available under Certificates."}</p></Card>}
  </Screen>;
}
