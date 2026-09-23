"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNaira, type DocumentType, type FeeBreakdown } from "@/lib/fees/legal-fees";
import {
  createInvoicePdf,
  createTermsPdf,
  BRANCH_NAME,
  PRACTITIONER_NAME,
  PREVIEW_REFERENCE,
  PRACTITIONER_SCN,
  downloadPdf,
  validateProof,
  validateText,
  type PreviewInvoice,
} from "@/lib/preview/documents";

type Basis = { document: DocumentType; amountKobo: bigint; fee: FeeBreakdown };
type Stage = "review" | "invoice" | "proof" | "pending";

const greenButton = "min-h-[51px] rounded-[9px] bg-nba-primary text-[15px] font-semibold shadow-none hover:bg-nba-primary-container";
const outlineButton = "min-h-[51px] rounded-[9px] border-[1.5px] border-nba-primary bg-white text-nba-primary text-[15px] font-semibold shadow-none";
const labelClass = "mb-[9px] block text-[13px] font-bold text-[#25292c]";
const inputClass = "min-h-[52px] w-full rounded-[9px] border border-[#cdd3d1] bg-white px-[13px] py-3 text-base text-[#25292c] outline-none placeholder:text-[#9099a5] focus:border-[#8c969b] focus:ring-2 focus:ring-[#dce1e0]";

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return <h2 className="mb-5 flex items-center gap-[10px] font-serif text-[20px] font-bold leading-[1.2] text-nba-primary"><span aria-hidden="true" className="font-sans text-[21px]">{icon}</span>{children}</h2>;
}

function DataRow({ label, value, strong = false, onCopy }: { label: string; value: string; strong?: boolean; onCopy?: () => void }) {
  return <div className="flex min-h-[64px] items-center justify-between gap-3 border-b border-[#e9ebeb] py-[13px] last:border-b-0">
    <div className="min-w-0"><p className="mb-[5px] text-[12px] tracking-[.06em] text-[#6a7382]">{label.toUpperCase()}</p><p className={`wrap-break-word text-[16px] text-[#25292c] ${strong ? "font-bold" : ""}`}>{value}</p></div>
    {onCopy ? <button aria-label={`Copy ${label}`} className="grid size-10 shrink-0 place-items-center rounded-full border-0 bg-[#f1f3f3] text-[#697381] focus-visible:outline-2 focus-visible:outline-nba-focus" onClick={onCopy} type="button"><svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20"><rect height="14" rx="1" stroke="currentColor" strokeWidth="2" width="12" x="8" y="7"/><path d="M5 17H4V4h13v1" stroke="currentColor" strokeWidth="2"/></svg></button> : null}
  </div>;
}

function ConfirmationDialog({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    dialog?.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
    return () => { dialog?.close(); previousFocus?.focus(); };
  }, []);

  return <dialog aria-labelledby="proof-confirm-title" className="fixed m-auto w-[min(420px,calc(100%-48px))] rounded-[14px] border-0 bg-white p-6 text-center shadow-xl backdrop:bg-[rgba(20,34,31,.46)]" onCancel={onCancel} ref={dialogRef}>
    <span aria-hidden="true" className="mx-auto mb-4 grid size-[85px] place-items-center rounded-full bg-[#e8f8ef] text-[38px] text-nba-primary">?</span>
    <h2 className="mb-3 font-serif text-[24px]" id="proof-confirm-title">Submit for verification?</h2>
    <p className="mb-5 text-[15px] leading-[1.45] text-[#66717e]">Your branch will review this proof of payment. You will not be able to change the transaction or replace the file while it is under review. In this local preview, no file is sent.</p>
    <Button className={greenButton} data-autofocus fullWidth onClick={onSubmit}>Submit</Button>
    <button className="mt-3 min-h-10 w-full border-0 bg-transparent font-semibold text-[#66717e]" onClick={onCancel} type="button">Keep editing</button>
  </dialog>;
}

export function TermsCard({ basis }: { basis: Basis }) {
  const [client, setClient] = useState("");
  const [matter, setMatter] = useState("");
  const [errors, setErrors] = useState<{ client?: string; matter?: string }>({});
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    const clientError = validateText(client, "Client");
    const matterError = validateText(matter, "The matter");
    setErrors({ client: clientError ?? undefined, matter: matterError ?? undefined });
    if (clientError || matterError) return;
    setWorking(true);
    setMessage("");
    try {
      downloadPdf(await createTermsPdf(basis, client, matter), "terms-of-engagement.pdf");
      setMessage("Terms of engagement PDF downloaded.");
    } catch {
      setMessage("Could not generate the draft PDF. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return <Card as="section" className="mt-4 rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
    <SectionTitle icon="✉">Terms of Engagement</SectionTitle>
    <p className="mb-[17px] text-[13px] leading-[1.5] text-[#66717e]">The Legal Practitioners (Remuneration) Order, 2023 requires written terms to reach your client within 14 days of accepting instructions. This produces a draft from the calculation above.</p>
    <div className="mb-[17px]"><label className={labelClass} htmlFor="terms-client">Client</label><input aria-invalid={Boolean(errors.client)} className={inputClass} id="terms-client" maxLength={160} onChange={(event) => { setClient(event.target.value); setErrors((old) => ({ ...old, client: undefined })); }} placeholder="Name of the client instructing you" value={client}/>{errors.client ? <p className="mt-1 text-xs text-nba-destructive">{errors.client}</p> : null}</div>
    <div className="mb-[17px]"><label className={labelClass} htmlFor="terms-matter">The matter</label><input aria-invalid={Boolean(errors.matter)} className={inputClass} id="terms-matter" maxLength={160} onChange={(event) => { setMatter(event.target.value); setErrors((old) => ({ ...old, matter: undefined })); }} placeholder="e.g. the sale of the property at 12 Ziks Avenue" value={matter}/>{errors.matter ? <p className="mt-1 text-xs text-nba-destructive">{errors.matter}</p> : null}</div>
    <Button className={outlineButton} fullWidth loading={working} onClick={generate}>Generate Terms of Engagement</Button>
    <p aria-live="polite" className="mt-2 min-h-4 text-center text-xs text-[#66717e]">{message}</p>
  </Card>;
}

export function PreviewFlow({ basis, onBack }: { basis: Basis; onBack: () => void }) {
  const [stage, setStage] = useState<Stage>("review");
  const [parties, setParties] = useState("");
  const [partiesError, setPartiesError] = useState("");
  const [invoice, setInvoice] = useState<PreviewInvoice | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function continueToInvoice() {
    const error = validateText(parties, "Parties to the Document");
    if (error) { setPartiesError(error); return; }
    setInvoice({ ...basis, parties: parties.trim(), createdAt: new Date() });
    setStage("invoice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function exportInvoice(share: boolean) {
    if (!invoice) return;
    setWorking(true);
    try {
      const blob = await createInvoicePdf(invoice);
      const filename = "branch-fee-invoice.pdf";
      const file = new File([blob], filename, { type: "application/pdf" });
      if (share && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "Branch fee invoice preview" });
        setMessage("Invoice preview shared.");
      } else {
        downloadPdf(blob, filename);
        setMessage(share ? "Sharing is unavailable here. Invoice PDF downloaded instead." : "Invoice PDF downloaded.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setMessage("Sharing cancelled.");
      else setMessage("Could not prepare the PDF. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  function chooseProof(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateProof(file);
    if (error) { setProof(null); setProofError(error); event.target.value = ""; return; }
    setProof(file);
    setProofError("");
  }

  const valueLabel = basis.document.category === "tenancy" ? "Annual rental value" : basis.document.category === "mortgage" ? "Mortgage value" : "Consideration / purchase price";
  const title = stage === "review" ? "Generate Invoice" : stage === "invoice" ? "Branch Fee Invoice" : stage === "proof" ? "Upload Proof" : "Submission preview complete";
  const description = stage === "review" ? "Confirm the figures and name the parties. A payment reference becomes available after issuance." : stage === "invoice" ? "This local invoice preview is not payable. Branch payment details become available after issuance." : stage === "proof" ? "Submit payment evidence for verification to proceed with document stamping. In this preview, the file stays on this device." : "Your selected file remained on this device. No branch review has started.";

  return <main className="mx-auto max-w-[800px] px-4 pt-[22px] pb-[70px] max-[375px]:px-3 min-[800px]:pt-[30px]">
    <button className="mb-3 border-0 bg-transparent p-0 text-xs font-semibold text-nba-primary underline" onClick={() => { if (stage === "review") onBack(); else if (stage === "invoice") setStage("review"); else if (stage === "proof") setStage("invoice"); else setStage("proof"); }} type="button">← Back</button>
    <h1 className="font-serif text-[28px] leading-[1.15] text-[#202326]">{title}</h1>
    <p className="mt-[7px] mb-5 text-[16px] leading-[1.45] text-[#66717e]">{description}</p>

    {stage === "review" ? <>
      <Card as="section" className="mb-4 rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
        <SectionTitle icon="▣">Calculated fee</SectionTitle>
        <DataRow label="Document type" value={basis.document.label}/>
        <DataRow label={valueLabel} value={formatNaira(basis.amountKobo)}/>
        <DataRow label="Professional fee" value={formatNaira(basis.fee.primaryFeeKobo)}/>
        <DataRow label="Payable to your branch" strong value={formatNaira(basis.fee.branchLevyKobo)}/>
      </Card>
      <Card as="section" className="mb-4 rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
        <SectionTitle icon="♟">Parties</SectionTitle>
        <label className={labelClass} htmlFor="invoice-parties">Parties to the Document</label>
        <textarea aria-describedby="parties-help" aria-invalid={Boolean(partiesError)} className={`${inputClass} min-h-[65px] resize-y`} id="invoice-parties" maxLength={160} onChange={(event) => { setParties(event.target.value); setPartiesError(""); }} placeholder="e.g. Chinedu Okafor to Adeola Properties Ltd" value={parties}/>
        <p className="mt-[5px] text-xs leading-[1.4] text-[#66717e]" id="parties-help">This appears on the invoice and on your Certificate of Compliance, so use the names as they appear on the instrument.</p>
        {partiesError ? <p className="mt-1 text-xs text-nba-destructive">{partiesError}</p> : null}
      </Card>
      <Button className={greenButton} fullWidth onClick={continueToInvoice}>Generate Invoice</Button>
      <p className="mt-3 text-center text-xs leading-[1.4] text-[#66717e]">Generating an invoice does not pay anything. Payment details become available after issuance.</p>
    </> : null}

    {stage === "invoice" && invoice ? <>
      <Card as="section" className="mb-4 rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
        <div className="mb-3 flex items-center gap-3 border-b border-[#e1e4e4] pb-3"><Image alt="" className="size-10 object-contain" height={40} src="/nba-seal.png" width={40}/><div><h2 className="text-[17px] font-bold text-nba-primary">{BRANCH_NAME}</h2><p className="text-sm text-[#66717e]">NBA Legal Fees</p></div></div>
        <DataRow label="Legal practitioner" strong value={PRACTITIONER_NAME}/>
        <DataRow label="Reference" strong value={PREVIEW_REFERENCE}/>
        <DataRow label="Document type" value={invoice.document.label}/>
        <DataRow label="Parties" value={invoice.parties}/>
        <DataRow label={valueLabel} value={formatNaira(invoice.amountKobo)}/>
        <DataRow label="Date" value={invoice.createdAt.toLocaleDateString("en-GB")}/>
      </Card>
      <Card as="section" className="mb-4 rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
        <SectionTitle icon="▥">Pay into this account</SectionTitle>
        <DataRow label="Account name" strong value="Available after issuance"/>
        <DataRow label="Account number" strong value="Available after issuance"/>
        <DataRow label="Bank" strong value="Available after issuance"/>
        <DataRow label="Use this reference" strong value={PREVIEW_REFERENCE}/>
        <div className="mt-3 rounded-[9px] bg-[#fff4d9] p-3 text-[13px] leading-[1.4] text-[#785414]">No account or payment reference has been issued. Do not make a transfer against this preview.</div>
      </Card>
      <p className="mb-4 text-center text-[17px] font-bold text-nba-primary">Branch amount: {formatNaira(invoice.fee.branchLevyKobo)}</p>
      <div className="grid gap-2"><Button className={greenButton} fullWidth onClick={() => { setStage("proof"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>View proof upload</Button><Button className={outlineButton} disabled={working} fullWidth onClick={() => exportInvoice(false)}>Download PDF</Button><Button className={outlineButton} disabled={working} fullWidth onClick={() => exportInvoice(true)}>Share invoice</Button></div>
      <p aria-live="polite" className="mt-2 min-h-4 text-center text-xs text-[#66717e]">{message}</p>
    </> : null}

    {stage === "proof" && invoice ? <>
      <div className="mb-5 flex items-start justify-between gap-2 text-center text-xs"><div className="flex-1"><span className="mx-auto mb-1 grid size-8 place-items-center rounded-full bg-nba-primary text-white">✓</span><strong>Invoice</strong></div><div className="mt-4 h-[2px] flex-1 bg-nba-primary"/><div className="flex-1"><span className="mx-auto mb-1 grid size-8 place-items-center rounded-full bg-nba-primary text-white">2</span><strong>Proof of payment</strong></div><div className="mt-4 h-[2px] flex-1 bg-[#dce2e0]"/><div className="flex-1 text-[#66717e]"><span className="mx-auto mb-1 grid size-8 place-items-center rounded-full border border-[#dce2e0]">3</span><span>Verified</span></div></div>
      <span className="mb-3 inline-block rounded-full bg-[#fff4d9] px-3 py-2 text-xs font-bold text-[#785414]">Awaiting Payment</span>
      <Card as="section" className="mb-4 rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
        <SectionTitle>Transaction</SectionTitle>
        <DataRow label="Name of practitioner" value={PRACTITIONER_NAME}/>
        <DataRow label="Supreme Court number" value={`${PRACTITIONER_SCN}`}/>
        <DataRow label="Parties to the document" value={invoice.parties}/>
        <DataRow label="Type of document" value={invoice.document.label}/>
        <DataRow label={valueLabel} value={formatNaira(invoice.amountKobo)}/>
        <DataRow label="Amount payable" strong value={formatNaira(invoice.fee.branchLevyKobo)}/>
      </Card>
      <Card as="section" className="rounded-nba-large border-[#e0e2e2] bg-white p-4" padding="none">
        <SectionTitle>Upload Proof of Payment</SectionTitle>
        <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" id="proof-file" onChange={chooseProof} ref={fileRef} type="file"/>
        <label className="grid min-h-[205px] cursor-pointer place-content-center justify-items-center rounded-[12px] border-2 border-dashed border-[#cdd4d1] bg-[#f8faf9] p-4 text-center" htmlFor="proof-file"><span aria-hidden="true" className="mb-3 grid size-[52px] place-items-center rounded-[11px] bg-[#ebeeee] text-[26px] text-[#697381]">⇧</span><strong className="mb-2 text-sm">Tap or click to browse files</strong><span className="mb-3 text-xs text-[#66717e]">Supported formats: PDF, JPG, PNG (max 10MB)</span><span className="rounded-[9px] border border-[#cdd4d1] bg-white px-4 py-2 text-sm font-semibold">Select File</span></label>
        {proofError ? <p aria-live="polite" className="mt-2 text-xs text-nba-destructive">{proofError}</p> : null}
        {proof ? <div className="mt-3 flex items-center justify-between gap-3 rounded-[9px] bg-[#f2f4f4] px-3 py-3 text-sm"><span className="min-w-0 truncate">{proof.name}</span><button className="shrink-0 border-0 bg-transparent font-semibold text-[#b43f29]" onClick={() => { setProof(null); if (fileRef.current) fileRef.current.value = ""; }} type="button">Remove</button></div> : null}
        <Button className={`${greenButton} mt-4`} disabled={!proof} fullWidth onClick={() => setConfirmOpen(true)}>Submit for Verification</Button>
      </Card>
    </> : null}

    {stage === "pending" ? <Card as="section" className="rounded-nba-large border-[#e0e2e2] bg-white p-5 text-center" padding="none"><span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-[#e8f8ef] text-2xl text-nba-primary">✓</span><h2 className="font-serif text-xl">Submission preview complete</h2><p className="mt-2 text-sm leading-[1.5] text-[#66717e]">Your file stayed on this device. No branch review or payment verification has started.</p><Button className={`${outlineButton} mt-4`} onClick={onBack}>Back to calculator</Button></Card> : null}

    {confirmOpen ? <ConfirmationDialog onCancel={() => setConfirmOpen(false)} onSubmit={() => { setConfirmOpen(false); setStage("pending"); setProof(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}/> : null}
  </main>;
}
