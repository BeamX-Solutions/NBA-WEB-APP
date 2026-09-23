"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PreviewFlow, TermsCard } from "@/components/calculator/preview-flow";
import { CheckIcon, SearchIcon } from "@/components/ui/icons";
import {
  calculateLegalFee,
  DOCUMENT_TYPES,
  formatNaira,
  parseNairaToKobo,
  type DocumentType,
  type FeeBreakdown,
} from "@/lib/fees/legal-fees";

const PRACTITIONER_NAME = "Adaeze"; // Local preview identity until authenticated profile data is available.
const fieldLabelClass = "mb-[10px] block text-[13px] font-bold";
const fieldErrorClass = "mt-[6px] text-xs text-nba-destructive";
const focusClass = "focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2";
const submitClass = "min-h-[51px] rounded-[9px] bg-nba-primary text-[15px] font-semibold shadow-none hover:bg-nba-primary-container";
const navItemClass = "flex min-w-0 flex-col items-center justify-center gap-[5px] rounded-[8px] border-0 text-[11px] font-semibold max-[375px]:text-[10px]";

function DocumentIcon({ size = 20 }: { size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}><path d="M6 2.8h8l4.5 4.5V21H6a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M14 3v5h4.5M8 12h7M8 16h7" stroke="#fff" strokeLinecap="round" strokeWidth="1.6"/></svg>;
}

function ReceiptIcon({ size = 28 }: { size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}><path d="M5 2.5 7 4l2-1.5L11 4l2-1.5L15 4l2-1.5L19 4v17l-2-1.5L15 21l-2-1.5L11 21l-2-1.5L7 21l-2-1.5v-17Z" fill="currentColor"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" strokeLinecap="round" strokeWidth="1.5"/></svg>;
}

function PersonIcon() {
  return <svg aria-hidden="true" fill="currentColor" height="22" viewBox="0 0 24 24" width="22"><circle cx="12" cy="7.5" r="4"/><path d="M3.5 21c.3-4.3 3.5-7 8.5-7s8.2 2.7 8.5 7H3.5Z"/></svg>;
}

function CalculatorIcon() {
  return <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><rect x="3" y="2" width="18" height="20" rx="2" fill="currentColor"/><path d="M7 7h6m-3-3v6m6-2 3-3m-3 0 3 3M7 16h6m-3-3v6m6-2h3" stroke="#fff" strokeLinecap="round" strokeWidth="1.5"/></svg>;
}

function CertificateIcon() {
  return <svg aria-hidden="true" fill="currentColor" height="22" viewBox="0 0 24 24" width="22"><path d="m12 1.5 2.7 2 3.3-.3 1.2 3 3 1.2-.3 3.3 2 2.8-2 2.7.3 3.3-3 1.2-1.2 3-3.3-.3-2.7 2-2.7-2-3.3.3-1.2-3-3-1.2.3-3.3-2-2.7 2-2.8-.3-3.3 3-1.2 1.2-3 3.3.3L12 1.5Z"/><path d="m7.5 12.2 3 3 6-6" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

function CloseIcon() {
  return <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/></svg>;
}

function ChevronIcon() {
  return <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="m5 9 7 7 7-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>;
}

function Modal({ children, labelId, onClose, sheet = false }: { children: ReactNode; labelId: string; onClose: () => void; sheet?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), a[href]"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return <div className="fixed inset-0 z-50 grid place-items-center"><button aria-label="Close dialog" className="absolute inset-0 h-full w-full cursor-default border-0 bg-[rgba(20,34,31,.46)]" onClick={onClose} tabIndex={-1} type="button"/><div aria-labelledby={labelId} aria-modal="true" className={`relative max-h-[calc(100dvh-32px)] overflow-y-auto bg-white shadow-[0_16px_60px_rgba(0,0,0,.17)] ${sheet ? "w-full max-w-[600px] self-end rounded-t-2xl px-4 pt-0 pb-[max(12px,env(safe-area-inset-bottom))] min-[800px]:max-h-[75dvh] min-[800px]:self-center min-[800px]:rounded-[14px]" : "w-[min(420px,calc(100%-32px))] rounded-[14px] p-5"}`} ref={panelRef} role="dialog">{children}</div></div>;
}

function DocumentPicker({ selectedId, onClose, onSelect }: { selectedId: string; onClose: () => void; onSelect: (document: DocumentType) => void }) {
  const [query, setQuery] = useState("");
  const matches = DOCUMENT_TYPES.filter((document) => document.label.toLowerCase().includes(query.trim().toLowerCase()));

  return <Modal labelId="document-picker-title" onClose={onClose} sheet><div className="mx-auto mt-[7px] mb-[15px] h-1 w-10 rounded-[9px] bg-[#e2e4e4]"/><div className="mb-4 flex items-center justify-between gap-3"><h2 className="m-0 text-[17px] leading-[1.3]" id="document-picker-title">Document / Transaction Type</h2><button aria-label="Close document picker" className={`grid size-[30px] shrink-0 place-items-center border-0 bg-transparent text-[#64707e] ${focusClass}`} onClick={onClose} type="button"><CloseIcon/></button></div><div className="flex h-[50px] items-center gap-[5px] rounded-nba-medium border border-[#cdd1d2] px-[14px] text-[#68727e] focus-within:border-[#8c969b] focus-within:shadow-[0_0_0_2px_rgba(106,117,123,.16)]"><SearchIcon size={19}/><label className="sr-only" htmlFor="document-search">Search document types</label><input autoComplete="off" className="h-full w-full border-0 bg-transparent text-[15px] text-[#272b2e] outline-none placeholder:text-[#8a939d]" data-autofocus id="document-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search" type="search" value={query}/></div><div aria-label="Document types" className="mt-[2px] max-h-[calc(78dvh-165px)] overflow-y-auto min-[800px]:max-h-[calc(75dvh-165px)]" role="group">{matches.length ? matches.map((document) => <button aria-pressed={selectedId === document.id} className={`flex min-h-11 w-full items-center justify-between gap-3 border-0 border-b border-[#e5e7e7] bg-white py-[9px] text-left text-[15px] last:border-b-0 ${focusClass} ${selectedId === document.id ? "font-bold text-nba-primary" : "text-[#262b2d]"}`} key={document.id} onClick={() => onSelect(document)} type="button"><span>{document.label}</span>{selectedId === document.id ? <CheckIcon size={22}/> : null}</button>) : <p className="py-5 text-sm text-[#68727c]">No document types match “{query}”.</p>}</div></Modal>;
}

function ResultCard({ document, result, onInvoice }: { document: DocumentType | null; result: FeeBreakdown | null; onInvoice: () => void }) {
  return <Card as="section" className="min-w-0 overflow-hidden rounded-nba-large border-[#e0e2e2] bg-white" padding="none">
    <div className="border-b border-[#e1e4e4] bg-[#f8faf9] px-4 pt-[18px] pb-[15px] max-[375px]:px-[14px]"><h2 className="mb-[5px] text-[13px] leading-[1.3] tracking-[.035em]">PRESCRIBED MINIMUM FEE</h2><p className="text-xs leading-[1.45] text-[#66717d]">Per the Legal Practitioners (Remuneration) Order, 2023</p></div>
    {document && result ? <div aria-live="polite" className="px-4 pt-[18px] pb-[21px] max-[375px]:px-[14px]"><p className="mb-px text-xs text-[#68727c]">{document.id === "deed-of-conveyance" ? "Purchaser's practitioner" : result.primaryRole}</p><strong className="block font-serif text-[33px] leading-[1.2] text-nba-primary">{formatNaira(result.primaryFeeKobo)}</strong><p className="mt-px mb-[11px] text-xs text-[#68727c]">{document.description.split(" - ")[0]} - {document.label}</p><div className="border-y border-[#e3e5e5] py-[7px]">{result.lines.map((line) => <div className="flex min-h-[39px] items-center justify-between gap-2" key={line.label}><span className="text-[13px] text-[#68727c]">{line.label}</span><strong className="shrink-0 text-xs text-[#292d31]">{formatNaira(line.amountKobo)}</strong></div>)}</div><div className="my-[13px] mb-[15px] grid gap-1 rounded-nba-medium bg-nba-surface-container p-3"><span className="text-xs text-[#68727c]">{document.id === "deed-of-conveyance" ? "Vendor's practitioner (half rate)" : result.counterpartyRole}</span><strong className="text-[17px]">{formatNaira(result.counterpartyFeeKobo)}</strong></div><div className="mb-[11px] flex items-center justify-between gap-[10px] text-sm"><span className="text-[#68727c]">Payable to NBA branch</span><strong className="text-[13px]">{formatNaira(result.branchLevyKobo)}</strong></div><div className="mb-[11px] flex items-center justify-between gap-[10px] text-sm font-bold"><span>Total</span><strong className="text-sm text-nba-primary">{formatNaira(result.totalKobo)}</strong></div><p className="mb-[15px] text-xs leading-[1.4] text-[#68727c]">This is the prescribed minimum, exclusive of VAT and of disbursements such as stamp duties, registration fees and Governor&apos;s Consent. Charging below scale requires an application to the Legal Practitioners&apos; Remuneration Committee. The branch amount is a local preview figure.</p><Button className={submitClass} fullWidth onClick={onInvoice}>Generate Invoice</Button><p className="mt-[9px] text-center text-xs leading-[1.35] text-[#68727c]">A subscription is required to issue a payable invoice. This preview creates no payment reference.</p></div> : <div className="grid min-h-[175px] justify-items-center px-[22px] pt-[38px] pb-5 text-center text-[#c9cece]"><ReceiptIcon size={38}/><p className="mt-[14px] max-w-[330px] text-[15px] leading-[1.45] text-[#66717d]">Enter transaction details and calculate to see the fee breakdown.</p></div>}
  </Card>;
}

export function CalculatorFlow() {
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [amount, setAmount] = useState("");
  const [poaBasis, setPoaBasis] = useState<"property-transfer" | "other" | "">("");
  const [result, setResult] = useState<FeeBreakdown | null>(null);
  const [calculatedAmountKobo, setCalculatedAmountKobo] = useState<bigint | null>(null);
  const [showPreview, setShowDemo] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [navMessage, setNavMessage] = useState("");
  const documentTriggerRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function selectDocument(next: DocumentType) {
    setDocument(next);
    setPoaBasis("");
    setResult(null);
    setCalculatedAmountKobo(null);
    setError("");
    setPickerOpen(false);
  }

  function updateAmount(value: string) {
    const raw = value.replaceAll(",", "").replace(/^₦\s*/, "");
    if (!/^\d*(?:\.\d{0,2})?$/.test(raw)) return;
    setAmount(raw);
    setResult(null);
    setCalculatedAmountKobo(null);
    setError("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document) {
      setError("Select a document or transaction type.");
      documentTriggerRef.current?.focus();
      return;
    }
    if (document.requiresPropertyTransfer && poaBasis !== "property-transfer") {
      setError(poaBasis === "other" ? "This authority alone has no automatic Scale 4A percentage. Assess the underlying service under the applicable Order scale." : "Confirm that this instrument forms part of a property assignment or conveyance.");
      return;
    }
    const parsed = parseNairaToKobo(amount);
    if (parsed === null) {
      setError("Enter an amount above ₦0 and no more than ₦1 trillion.");
      globalThis.document.getElementById("calculator-amount")?.focus();
      return;
    }
    setResult(calculateLegalFee(document.category, parsed));
    setCalculatedAmountKobo(parsed);
    setError("");
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const amountError = Boolean(error && document && (!document.requiresPropertyTransfer || poaBasis === "property-transfer"));
  const amountLabel = document?.category === "mortgage" ? "Mortgage value (₦)" : document?.category === "tenancy" ? "Annual rental value (₦)" : document?.requiresPropertyTransfer || document && ["deed-of-gift", "deed-of-surrender", "deed-of-exchange"].includes(document.id) ? "Property value (₦)" : document ? "Consideration / purchase price (₦)" : "Amount (₦)";

  useEffect(() => {
    if (!navMessage) return;
    const timer = window.setTimeout(() => setNavMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [navMessage]);

  return <div className="min-h-screen bg-[#fcfcfd] font-[Arial,Helvetica,sans-serif] text-[#24272a]">
    <header className="flex h-[118px] items-center justify-between border-b border-[#e9e9e9] bg-white px-6 pt-[70px] pb-4 min-[800px]:h-[88px] min-[800px]:px-[max(32px,calc((100vw-1080px)/2))] min-[800px]:py-4">
      <Link aria-label="NBA Legal Fees home" className={focusClass} href="/"><Image alt="NBA Anaocha Branch" className="size-[35px] object-contain" height={35} src="/nba-seal.png" width={35}/></Link>
      <button aria-label="Profile unavailable" className={`grid size-10 place-items-center rounded-full border-0 bg-[#f8f9f9] text-[#66717e] ${focusClass}`} onClick={() => setNavMessage("Profile is not available yet.")} type="button"><PersonIcon/></button>
    </header>
    {showPreview && document && result && calculatedAmountKobo !== null ? <PreviewFlow basis={{ document, amountKobo: calculatedAmountKobo, fee: result }} onBack={() => setShowDemo(false)}/> : <main className="mx-auto max-w-[1080px] px-4 pt-[18px] pb-[calc(110px+env(safe-area-inset-bottom))] max-[375px]:px-3 min-[800px]:px-7 min-[800px]:pt-[30px] min-[800px]:pb-[115px]">
      <div className="mb-[18px] min-[800px]:mb-6"><p className="mb-[3px] text-sm leading-normal text-[#636c78]">Good evening,</p><h1 className="font-serif text-[26px] leading-[1.22] min-[800px]:text-[33px]">{PRACTITIONER_NAME}</h1></div>
      <div className="grid gap-4 min-[800px]:grid-cols-2 min-[800px]:items-start min-[800px]:gap-6">
        <Card as="section" className="min-w-0 overflow-hidden rounded-nba-large border-[#e0e2e2] bg-white px-4 pt-[18px] pb-4 max-[375px]:px-[14px]" padding="none">
          <div className="mb-[14px] flex items-center gap-[9px] text-nba-primary"><DocumentIcon/><h2 className="font-serif text-[19px] leading-[1.3]">Transaction Details</h2></div>
          <form noValidate onSubmit={submit}>
            <div className="mb-[18px]"><label className={fieldLabelClass} id="document-label">Document / Transaction Type</label><button aria-describedby={`${document ? "document-hint " : ""}${error && !document ? "document-error" : ""}`.trim() || undefined} aria-expanded={pickerOpen} aria-haspopup="dialog" aria-labelledby="document-label document-value" className={`flex min-h-[50px] w-full items-center justify-between gap-3 rounded-[9px] border bg-white px-[13px] text-left text-base ${focusClass} ${error && !document ? "border-nba-destructive" : "border-[#cdd1d2]"} ${document ? "text-[#272b2e]" : "text-[#8b929d]"}`} onClick={() => setPickerOpen(true)} ref={documentTriggerRef} type="button"><span id="document-value">{document?.label ?? "Select Document Type"}</span><span className="shrink-0 text-[#677381]"><ChevronIcon/></span></button>{document ? <p className="mt-[5px] text-xs text-[#68727e]" id="document-hint">{document.description}</p> : null}{error && !document ? <p className={fieldErrorClass} id="document-error">{error}</p> : null}</div>
            {document?.requiresPropertyTransfer ? <fieldset className="mb-[18px] rounded-[9px] border border-[#cdd1d2] p-3"><legend className="px-1 text-[13px] font-bold">Underlying transaction</legend><label className="mb-2 flex items-start gap-2 text-[13px]"><input checked={poaBasis === "property-transfer"} name="poa-basis" onChange={() => { setPoaBasis("property-transfer"); setError(""); setResult(null); }} type="radio"/>Property assignment or conveyance</label><label className="flex items-start gap-2 text-[13px]"><input checked={poaBasis === "other"} name="poa-basis" onChange={() => { setPoaBasis("other"); setError(""); setResult(null); }} type="radio"/>Authority only or another service</label><p className="mt-2 text-xs text-[#68727e]">Scale 4A applies only if the underlying transaction is a property transfer.</p>{error && poaBasis !== "property-transfer" ? <p className={fieldErrorClass} role="alert">{error}</p> : null}</fieldset> : null}
            <div className="mb-[17px]"><label className={fieldLabelClass} htmlFor="calculator-amount">{amountLabel}</label><div className={`flex min-h-[50px] w-full items-center rounded-[9px] border bg-white pl-[13px] text-base focus-within:border-[#8c969b] focus-within:shadow-[0_0_0_2px_rgba(106,117,123,.16)] ${amountError ? "border-nba-destructive focus-within:border-nba-destructive focus-within:shadow-[0_0_0_2px_rgba(185,28,28,.12)]" : "border-[#cdd1d2]"}`}><span aria-hidden="true" className="mr-[5px] font-bold">₦</span><input aria-describedby={amountError ? "amount-error" : undefined} aria-invalid={amountError || undefined} autoComplete="off" className="h-12 min-w-0 w-full border-0 bg-transparent text-base text-[#262a2d] outline-none placeholder:text-[#929aa4]" id="calculator-amount" inputMode="decimal" onBlur={() => { const parsed = parseNairaToKobo(amount); if (parsed !== null) setAmount(formatNaira(parsed).slice(1)); }} onChange={(event) => updateAmount(event.target.value)} placeholder="0.00" type="text" value={amount}/></div>{amountError ? <p className={fieldErrorClass} id="amount-error">{error}</p> : null}</div>
            <Button className={submitClass} fullWidth type="submit">Calculate Fee</Button>
          </form>
        </Card>
        <div ref={resultRef}><ResultCard document={document} onInvoice={() => { setShowDemo(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} result={result}/>{document && result && calculatedAmountKobo !== null ? <TermsCard basis={{ document, amountKobo: calculatedAmountKobo, fee: result }} key={`${document.id}:${calculatedAmountKobo}`}/> : null}</div>
      </div>
    </main>}
    {!showPreview ? <nav aria-label="Practitioner navigation" className="fixed right-0 bottom-0 left-0 z-20 grid h-[calc(70px+env(safe-area-inset-bottom))] grid-cols-4 gap-[4px] border-t border-[#eef0ef] bg-white p-[6px] pb-[calc(6px+env(safe-area-inset-bottom))] min-[800px]:mx-auto min-[800px]:h-[72px] min-[800px]:w-[430px] min-[800px]:rounded-t-nba-large min-[800px]:border min-[800px]:border-[#e1e5e3] min-[800px]:shadow-[0_-3px_20px_rgba(0,0,0,.05)]">
      <Link aria-current="page" className={`${navItemClass} ${focusClass} bg-[#fac542] text-nba-primary`} href="/"><CalculatorIcon/><span>Calculator</span></Link>
      <button className={`${navItemClass} ${focusClass} bg-transparent text-[#65707e]`} onClick={() => setNavMessage("Transactions are not available yet.")} type="button"><ReceiptIcon size={22}/><span>Transactions</span></button>
      <button className={`${navItemClass} ${focusClass} bg-transparent text-[#65707e]`} onClick={() => setNavMessage("Certificates are not available yet.")} type="button"><CertificateIcon/><span>Certificates</span></button>
      <button className={`${navItemClass} ${focusClass} bg-transparent text-[#65707e]`} onClick={() => setNavMessage("Profile is not available yet.")} type="button"><PersonIcon/><span>Profile</span></button>
    </nav> : null}
    <div aria-live="polite" className={`pointer-events-none fixed right-4 bottom-[105px] left-4 z-25 mx-auto max-w-[400px] rounded-nba-medium bg-[#17392b] px-[15px] py-[10px] text-center text-[13px] text-white transition-[opacity,transform] duration-200 motion-reduce:transition-none ${navMessage ? "translate-y-0 opacity-100" : "translate-y-[10px] opacity-0"}`} role="status">{navMessage}</div>
    {pickerOpen ? <DocumentPicker onClose={() => setPickerOpen(false)} onSelect={selectDocument} selectedId={document?.id ?? ""}/> : null}
  </div>;
}
