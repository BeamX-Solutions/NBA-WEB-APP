"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormNotice } from "@/components/ui/form-notice";
import type { TransactionRecord } from "@/lib/transactions/contracts";
import { useRef, useState, type ChangeEvent } from "react";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { validateProof } from "@/lib/preview/documents";
import { statusLabels, type SampleTransaction } from "@/lib/transactions/sample-transactions";

function Progress({ status }: { status: SampleTransaction["status"] }) {
  const isVerified = status === "verified";
  return <div aria-label={`Progress: ${statusLabels[status]}`} className="mt-4 flex items-start justify-between gap-2 text-center">
    <div className="w-[72px] shrink-0"><span className="mx-auto grid size-[29px] place-items-center rounded-full bg-nba-primary text-[16px] font-bold text-white">✓</span><strong className="mt-2 block text-[12px] leading-[1.25]">Invoice</strong></div>
    <span aria-hidden="true" className="mt-[14px] h-[2px] min-w-4 flex-1 bg-nba-primary"/>
    <div className="w-[92px] shrink-0"><span className="mx-auto grid size-[29px] place-items-center rounded-full bg-nba-primary text-[14px] font-bold text-white">{isVerified ? "✓" : "2"}</span><strong className="mt-2 block text-[12px] leading-[1.25]">Proof of<br/>payment</strong></div>
    <span aria-hidden="true" className={`mt-[14px] h-[2px] min-w-4 flex-1 ${isVerified ? "bg-nba-primary" : "bg-[#e4e8e6]"}`}/>
    <div className="w-[72px] shrink-0"><span className={`mx-auto grid size-[29px] place-items-center rounded-full border text-[14px] font-bold ${isVerified ? "border-nba-primary bg-nba-primary text-white" : "border-[#dfe4e1] bg-[#f1f4f1] text-[#6c727c]"}`}>3</span><strong className={`mt-2 block text-[12px] leading-[1.25] ${isVerified ? "text-[#24272a]" : "text-[#6c727c]"}`}>Verified</strong></div>
  </div>;
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="border-b border-[#eceeee] py-[11px] last:border-b-0"><dt className="mb-[4px] text-[12px] tracking-[.07em] text-[#6c727c] uppercase">{label}</dt><dd className={`m-0 wrap-break-word text-[16px] leading-[1.35] ${strong ? "font-bold" : ""}`}>{value}</dd></div>;
}

function ProofPicker({ transactionId }: { transactionId?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
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

  async function handleSubmit() {
    if (!file || submitting.current || requiresRefresh) return;
    if (!transactionId) { setMessage("Local preview only. Your file was not sent to a branch, and this transaction remains unchanged."); return; }
    submitting.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.set("proof", file);
      const response = await fetch(`/transactions/${transactionId}/proof`, { method: "POST", body: form });
      const result: unknown = await response.json();
      const message = result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : "Submission could not be confirmed. Refresh before trying again.";
      if (!response.ok) { setError(message); setRequiresRefresh(response.status >= 409); return; }
      setMessage(message);
      setRequiresRefresh(true);
      router.refresh();
    } catch {
      setError("Submission could not be confirmed. Refresh the transaction before trying again.");
      setRequiresRefresh(true);
    } finally { submitting.current = false; setPending(false); }
  }

  return <section className="mt-4 rounded-[13px] border border-[#e0e2e2] bg-white p-4"><h2 className="mb-4 font-serif text-[17px] font-bold text-nba-primary">Upload Proof of Payment</h2>
    <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="peer sr-only" disabled={pending || requiresRefresh} id="sample-proof-file" onChange={chooseFile} ref={inputRef} type="file"/>
    <label className="grid min-h-[205px] cursor-pointer place-content-center justify-items-center rounded-[12px] border-2 border-dashed border-[#cdd4d1] bg-[#f1f4f1] p-4 text-center peer-focus-visible:outline-2 peer-focus-visible:outline-nba-focus" htmlFor="sample-proof-file"><span aria-hidden="true" className="mb-3 grid size-[52px] place-items-center rounded-[11px] bg-[#e3e6e3] text-[#6c727c]"><svg fill="none" height="27" viewBox="0 0 24 24" width="27"><path d="M6 2h8l4 4v16H6V2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8"/><path d="M14 2v5h4M12 18V9m0 0-3 3m3-3 3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg></span><strong className="mb-2 text-[15px]">Tap or click to browse files</strong><span className="mb-3 text-[13px] text-[#6c727c]">Supported formats: PDF, JPG, PNG (max 10MB)</span><span className="rounded-[9px] border border-[#cdd4d1] bg-white px-4 py-2 text-[14px] font-semibold">Select File</span></label>
    {error ? <div className="mt-2"><FormNotice tone="error">{error}</FormNotice></div> : null}
    {file ? <div className="mt-3 flex items-center justify-between gap-3 rounded-[9px] bg-[#f2f4f4] px-3 py-3 text-[13px]"><span className="min-w-0 truncate">{file.name}</span><button className="shrink-0 border-0 bg-transparent font-semibold text-[#b43f29]" disabled={pending || requiresRefresh} onClick={removeFile} type="button">Remove</button></div> : null}
    <button className="mt-4 min-h-[51px] w-full rounded-[9px] border-0 bg-nba-primary px-4 text-[15px] font-semibold text-white disabled:bg-[#88a99a]" disabled={!file || pending || requiresRefresh} onClick={handleSubmit} type="button">{pending ? "Submitting…" : "Submit for Verification"}</button>
    {transactionId ? null : <p className="mt-2 text-[12px] leading-[1.4] text-[#6c727c]">Preview only. Selecting or submitting a file does not upload it.</p>}
    {requiresRefresh ? <button className="mt-2 text-sm font-semibold text-nba-primary underline" onClick={() => window.location.reload()} type="button">Refresh transaction</button> : null}
    {message ? <p aria-live="polite" className="mt-2 text-[13px] text-nba-primary" role="status">{message}</p> : null}
  </section>;
}

export function TransactionDetail({ transaction, live = false }: { transaction: SampleTransaction | TransactionRecord; live?: boolean }) {
  const { status } = transaction;
  return <div className="reference-proof"><TransactionShell><main className="mx-auto max-w-[850px] px-4 pt-[20px] pb-12 min-[800px]:px-7 min-[800px]:pt-9">
    <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="font-serif text-[26px] leading-[1.2] font-bold min-[800px]:text-[38px]">Upload Proof</h1>{live ? null : <span className="rounded-full bg-[#edf3f0] px-2 py-1 text-[11px] font-semibold text-nba-primary">Sample data</span>}</div>
    <p className="mt-2 text-[16px] leading-[1.45] text-[#6c727c]">Submit payment evidence for verification to proceed with document stamping.</p>
    <Progress status={status}/>
    <span className={`mt-4 inline-block rounded-full px-3 py-[8px] text-[12px] font-semibold ${status === "verified" ? "bg-[#e8f8ef] text-[#167345]" : status === "awaiting" ? "bg-[#fff6da] text-[#86601a]" : status === "rejected" ? "bg-[#fcece9] text-[#9b392d]" : "bg-[#f0f3f2] text-[#6c727c]"}`}>{statusLabels[status]}</span>
    <section className="mt-2 rounded-[13px] border border-[#e0e2e2] bg-white p-4"><h2 className="mb-2 font-serif text-[17px] font-bold text-nba-primary">Transaction</h2><dl className="m-0">{"invoiceNumber" in transaction ? <DetailRow label="Invoice number" value={transaction.invoiceNumber}/> : null}<DetailRow label="Name of Practitioner" value={transaction.practitioner}/><DetailRow label="Supreme Court Number" value={transaction.scn}/><DetailRow label="Parties to the Document" value={transaction.parties}/><DetailRow label="Type of Document" value={transaction.documentType}/><DetailRow label="Consideration" value={transaction.consideration}/><DetailRow label="Amount Payable" strong value={"amountPayable" in transaction ? transaction.amountPayable : transaction.professionalFee}/>{transaction.rbin ? <DetailRow label={live ? "RBIN" : "RBIN (sample)"} value={transaction.rbin}/> : null}</dl></section>
    {status === "awaiting" || status === "rejected" ? <>{status === "rejected" ? <section className="mt-4 rounded-[13px] border border-[#e0e2e2] bg-white p-4 text-[15px] leading-[1.5] text-[#6c727c]"><h2 className="mb-2 font-serif text-[19px] text-[#9b392d]">Proof rejected</h2><p>{transaction.rejectionReason}</p><p className="mt-2">{live ? "Select a clearer proof to resubmit for branch verification." : "Select another file to preview resubmission."}</p></section> : null}<ProofPicker transactionId={live ? transaction.id : undefined}/></> : <section className="mt-4 rounded-[13px] border border-[#e0e2e2] bg-white p-4 text-[15px] leading-[1.55] text-[#6c727c]">{status === "pending" ? live ? "Your proof of payment is with the branch for verification." : "In this sample, proof of payment is with the branch for verification. No real branch review has started." : live ? "Your transaction has been verified by the branch. Certificate issuance is managed by your branch." : "This sample transaction shows a verified state. A Certificate of Compliance would appear under Certificates after real branch issuance; no certificate has been issued here."}</section>}
    <Link className="mt-6 inline-block text-[13px] font-semibold text-nba-primary underline focus-visible:outline-2 focus-visible:outline-nba-focus" href="/transactions">← Back to Transactions</Link>
  </main></TransactionShell></div>;
}
