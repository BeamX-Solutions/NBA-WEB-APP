"use client";

import { useRef, useState } from "react";
import { InvoiceFlow, TermsCard } from "@/components/calculator/preview-flow";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { SelectField, TextField } from "@/components/mobile/field";
import { Icon } from "@/components/mobile/icon";
import { Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { Notice } from "@/components/mobile/states";
import type { CalculatorContext } from "@/lib/calculator/types";
import { calculateLegalFee, DOCUMENT_TYPES, FeeCalculationError, formatNaira, groupNairaInput, parseNairaToKobo, type DocumentType, type FeeBreakdown as Breakdown } from "@/lib/fees/legal-fees";
import { greetingFor } from "@/lib/names";
import { useOnline } from "@/lib/use-online";

const ORDER_SHORT_NAME = "Legal Practitioners (Remuneration) Order, 2023";
const documentOptions = DOCUMENT_TYPES.map((document) => ({ value: document.id, label: document.label }));

type Calculation = { document: DocumentType; amountKobo: bigint; fee: Breakdown };

function Row({ label, value, labelClass, valueClass }: { label: string; value: string; labelClass: string; valueClass: string }) {
  return <div className="flex items-start justify-between gap-3 py-1"><span className={`flex-1 ${labelClass}`}>{label}</span><span className={valueClass}>{value}</span></div>;
}

/** Where the invoice button stands: offline there is no server to create one, so say so instead. */
function InvoiceAction({ offline, onInvoice }: { offline: boolean; onInvoice: () => void }) {
  const online = useOnline();
  if (offline) return <Notice className="mt-4" tone="warning">Invoices, uploads and certificates need a connection. Reconnect and open the calculator again to generate an invoice.</Notice>;
  return <>
    <div className="mt-4"><Button disabled={!online} onClick={onInvoice}>{online ? "Generate Invoice" : "Offline: Generate Invoice unavailable"}</Button></div>
    <p className="mt-2 text-center text-caption leading-[17px] text-text-muted">Creates the invoice your client pays into the branch account. Calculating is free; a subscription is required to generate an invoice.</p>
  </>;
}

/** mobile FeeBreakdown: the figure, the working, the half rate, and the practitioner's side of it. */
function FeeBreakdown({ calculation, offline, onInvoice }: { calculation: Calculation; offline: boolean; onInvoice: () => void }) {
  const { document, fee } = calculation;
  return <div aria-live="polite">
    <p className="text-caption text-text-muted">{document.fullRateParty}</p>
    <strong className="block font-heading text-display leading-tight font-bold text-primary">{formatNaira(fee.professionalFeeKobo)}</strong>
    <p className="mt-1 text-caption text-text-muted">Scale {fee.scale} - {document.label}</p>
    <div className="my-3 h-px bg-border"/>
    {fee.lines.map((line) => <Row key={line.label} label={line.label} labelClass="text-label text-text-muted" value={formatNaira(line.amountKobo)} valueClass="text-label font-medium text-text"/>)}
    <div className="my-3 h-px bg-border"/>
    {fee.halfRateFeeKobo !== null && document.halfRateParty ? <div className="mb-3 rounded-input bg-surface-muted p-3"><p className="text-caption text-text-muted">{document.halfRateParty} (half rate)</p><p className="text-title font-semibold text-text">{formatNaira(fee.halfRateFeeKobo)}</p></div> : null}
    <Row label="Less NBA branch fee" labelClass="text-body text-text-muted" value={formatNaira(fee.branchFeeKobo)} valueClass="text-body font-semibold text-text"/>
    <Row label="Net to you" labelClass="text-body-lg font-bold text-text" value={formatNaira(fee.netFeeKobo)} valueClass="text-body-lg font-bold text-primary"/>
    <p className="mt-4 text-caption leading-[17px] text-text-muted">This is the prescribed minimum, exclusive of VAT and of disbursements such as stamp duties, registration fees and Governor&apos;s Consent. Charging below scale requires an application to the Legal Practitioners&apos; Remuneration Committee.</p>
    <InvoiceAction offline={offline} onInvoice={onInvoice}/>
  </div>;
}

/**
 * mobile (tabs)/index. From 800px the form and the result sit side by side. `offline` is the /offline
 * page's calculator: the same maths, with no invoice or terms letter, which need the server.
 */
export function CalculatorFlow({ context, offline = false }: { context: CalculatorContext; offline?: boolean }) {
  const [documentId, setDocumentId] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<{ documentType?: string; amount?: string }>({});
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const document = DOCUMENT_TYPES.find((item) => item.id === documentId) ?? null;
  const discretionary = document?.scale === "discretionary";

  function reset() {
    setCalculation(null);
    setCalculationError(null);
  }

  function calculate() {
    const nextErrors: typeof errors = {};
    if (!document) nextErrors.documentType = "Select the document type.";
    const amountKobo = parseNairaToKobo(amount);
    if (!discretionary && amountKobo === null) nextErrors.amount = "Enter the amount, for example 45,000,000.";
    setErrors(nextErrors);
    setCalculationError(null);
    if (Object.keys(nextErrors).length > 0 || !document) { setCalculation(null); return; }
    try {
      setCalculation({ document, amountKobo: amountKobo ?? 0n, fee: calculateLegalFee(document, amountKobo ?? 0n) });
    } catch (error) {
      // The engine refuses to guess; for Power of Attorney the reason is the answer.
      setCalculation(null);
      setCalculationError(error instanceof FeeCalculationError ? error.message : "The fee could not be calculated. Please try again.");
    }
    requestAnimationFrame(() => { if (window.innerWidth < 800) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  if (showInvoice && calculation) {
    return <Screen><InvoiceFlow calculation={calculation} context={context} onBack={() => setShowInvoice(false)}/></Screen>;
  }

  return <Screen wide>
    {offline ? <ScreenHeading subtitle="The fee calculator works without a connection. Invoices, uploads and certificates need one." title="You are offline"/> : <div className="mb-4">
      <p className="text-body text-text-muted" suppressHydrationWarning>{greetingFor(new Date().getHours())},</p>
      <h1 className="m-0 font-heading text-heading font-bold text-text">{context.firstName}</h1>
    </div>}
    {context.loadWarning ? <Notice className="mb-4" tone="warning">{context.loadWarning}</Notice> : null}
    <div className="grid gap-4 min-[800px]:grid-cols-2 min-[800px]:items-start">
      <Card>
        <SectionTitle icon="description">Transaction Details</SectionTitle>
        <form noValidate onSubmit={(event) => { event.preventDefault(); calculate(); }}>
          <SelectField error={errors.documentType} hint={document ? `Scale ${document.scale} - ${document.basisLabel}.` : undefined} id="calculator-document" label="Document / Transaction Type" onChange={(value) => { setDocumentId(value); setErrors((current) => ({ ...current, documentType: undefined })); reset(); }} options={documentOptions} placeholder="Select Document Type" value={documentId}/>
          {discretionary ? null : <TextField error={errors.amount} hint={document?.scale === "4C" ? "Enter one year of rent, not the total over the term." : undefined} id="calculator-amount" inputMode="decimal" label={`${document?.basisLabel ?? "Amount"} (₦)`} onChange={(event) => { setAmount(groupNairaInput(event.target.value)); setErrors((current) => ({ ...current, amount: undefined })); reset(); }} placeholder="0.00" prefix="₦" value={amount}/>}
          <Button type="submit">Calculate Fee</Button>
        </form>
      </Card>
      <div className="grid gap-4 scroll-mt-20" ref={resultRef}>
        <Card className="overflow-hidden p-0!">
          <div className="border-b border-border bg-surface-muted p-4"><h2 className="m-0 text-label font-bold tracking-[0.5px] text-text">PRESCRIBED MINIMUM FEE</h2><p className="mt-1 text-caption text-text-muted">Per the {ORDER_SHORT_NAME}</p></div>
          <div className="p-4">
            {calculationError ? <div className="flex flex-col items-center gap-3 py-4 text-center"><Icon color="var(--color-accent-text)" name="info-outline" size={32}/><p className="text-body leading-[21px] text-text">{calculationError}</p></div>
              : calculation ? <FeeBreakdown calculation={calculation} offline={offline} onInvoice={() => { setShowInvoice(true); window.scrollTo({ top: 0 }); }}/>
              : <div className="flex flex-col items-center gap-3 py-6 text-center"><Icon color="var(--color-border-strong)" name="receipt-long" size={44}/><p className="text-body leading-[21px] text-text-muted">Enter transaction details and calculate to see the fee breakdown.</p></div>}
          </div>
        </Card>
        {calculation && !offline ? <TermsCard calculation={calculation} context={context} key={`${calculation.document.id}:${calculation.amountKobo}`}/> : null}
      </div>
    </div>
  </Screen>;
}
