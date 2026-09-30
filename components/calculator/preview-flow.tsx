"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { createInvoiceAction } from "@/app/calculator-actions";
import { Button, ButtonLink } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { TextField } from "@/components/mobile/field";
import { Icon, type IconName } from "@/components/mobile/icon";
import { DetailList, DetailRow, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { Notice } from "@/components/mobile/states";
import type { CalculatorContext, CreateInvoiceActionState } from "@/lib/calculator/types";
import { formatNaira, type DocumentType, type FeeBreakdown } from "@/lib/fees/legal-fees";
import { createTermsPdf, downloadPdf, validateText } from "@/lib/preview/documents";

type Calculation = { amountKobo: bigint; document: DocumentType; fee: FeeBreakdown };

const initialInvoiceState: CreateInvoiceActionState = { fieldErrors: {}, message: "", status: "idle", transaction: null };
const ORDER_SHORT_NAME = "Legal Practitioners (Remuneration) Order, 2023";

/** mobile's Terms of Engagement card on the calculator. */
export function TermsCard({ calculation, context }: { calculation: Calculation; context: CalculatorContext }) {
  const [clientName, setClientName] = useState("");
  const [matter, setMatter] = useState("");
  const [errors, setErrors] = useState<{ clientName?: string; matter?: string }>({});
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function generate() {
    const next: typeof errors = {};
    if (validateText(clientName, "Client name")) next.clientName = "Terms of engagement are addressed to someone, so the client is required.";
    if (validateText(matter, "Matter description")) next.matter = "Describe the matter, so the letter records what was instructed.";
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length > 0) return;
    setFailure("");
    setWorking(true);
    try {
      const pdf = await createTermsPdf(calculation, clientName.trim(), matter.trim(), { name: context.displayName, scn: context.scn, branch: context.branch?.name ?? null });
      downloadPdf(pdf, `terms-of-engagement-${clientName.trim().replaceAll(/\s+/g, "-").toLowerCase()}.pdf`);
      setMessage("Terms of engagement PDF downloaded.");
    } catch {
      setFailure("The letter could not be generated. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return <Card>
    <SectionTitle icon="drafts">Terms of Engagement</SectionTitle>
    <p className="mb-3 text-caption leading-[18px] text-text-muted">The {ORDER_SHORT_NAME} requires written terms to reach your client within 14 days of accepting instructions. This produces them from the calculation above.</p>
    <TextField error={errors.clientName} id="terms-client" label="Client" maxLength={160} onChange={(event) => setClientName(event.target.value)} placeholder="Name of the client instructing you" value={clientName}/>
    <TextField error={errors.matter} id="terms-matter" label="The matter" maxLength={160} onChange={(event) => setMatter(event.target.value)} placeholder="e.g. the sale of the property at 12 Ziks Avenue, Awka" value={matter}/>
    {failure ? <p className="mb-2 text-caption text-danger" role="alert">{failure}</p> : null}
    <Button loading={working} onClick={generate} variant="outline">Generate Terms of Engagement</Button>
    {message ? <p className="mt-2 text-center text-caption text-primary" role="status">{message}</p> : null}
  </Card>;
}

type Block = { icon: IconName; title: string; body: string; action?: { href: string; label: string } };

/** Why an invoice cannot be drawn yet, told before the form rather than after submitting it. */
function blockFor(context: CalculatorContext): Block | null {
  if (context.loadWarning) return { icon: "error-outline", title: "Account details unavailable", body: context.loadWarning };
  if (!context.branch) return { icon: "account-balance", title: "You need a branch first", body: "An invoice names your branch's bank account, and a Certificate of Compliance is issued by a branch. Without one there is nobody to pay and nobody to verify the payment." };
  if (context.branch.activationStatus !== "active") return { icon: "account-balance", title: "Your branch is not active", body: "Your branch is not active for invoice creation. You can still use the calculator." };
  if (!context.subscription?.isCurrent) return { icon: "workspace-premium", title: "Subscription required", body: "An active subscription is required to create an invoice. Calculations remain free.", action: { href: "/profile/plans", label: "Choose a Plan" } };
  if (!context.hasBankDetails) return { icon: "account-balance-wallet", title: "Add your bank details", body: "Your client pays the fee into the branch account, and the branch sends your share to you. Add the account it should go to before generating an invoice.", action: { href: "/profile/edit", label: "Add bank details" } };
  return null;
}

/** mobile transaction/new: confirm the figures, name the parties, create the invoice. */
export function InvoiceFlow({ calculation, context, onBack }: { calculation: Calculation; context: CalculatorContext; onBack: () => void }) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [state, formAction, pending] = useActionState(
    async (previous: CreateInvoiceActionState, data: FormData) => {
      try { return await createInvoiceAction(previous, data); }
      catch { return { fieldErrors: {}, message: "The invoice response was interrupted. Check Transactions before creating another invoice.", requiresReview: true, status: "error" as const, transaction: null }; }
      finally { submittingRef.current = false; }
    },
    initialInvoiceState,
  );
  const [parties, setParties] = useState("");
  const [partiesError, setPartiesError] = useState("");
  const block = blockFor(context);
  const { amountKobo, document, fee } = calculation;

  // As on mobile, a new invoice opens on its own page, which is also where it is found again later.
  const createdId = state.status === "success" ? state.transaction?.id : undefined;
  useEffect(() => {
    if (createdId) router.replace(`/transactions/${createdId}/invoice`);
  }, [createdId, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending || submittingRef.current || state.requiresReview || block) { event.preventDefault(); return; }
    if (!parties.trim()) { event.preventDefault(); setPartiesError("Name the parties to the document."); return; }
    submittingRef.current = true;
    setPartiesError("");
  }

  const back = <button className="mt-2 w-full border-0 bg-transparent py-3 text-body-lg font-semibold text-text-muted" onClick={onBack} type="button">Back to calculator</button>;

  if (createdId) return <Notice tone="success">Invoice created. Opening it…</Notice>;

  return <>
    <ScreenHeading subtitle="Confirm the figures and name the parties. This creates the invoice your client pays into the branch account." title="Generate Invoice"/>
    {block ? <Card>
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <Icon color="var(--color-accent-text)" name={block.icon} size={36}/>
        <h2 className="m-0 font-heading text-title font-bold text-text">{block.title}</h2>
        <p className="text-body leading-[21px] text-text-muted">{block.body}</p>
      </div>
      {block.action ? <ButtonLink href={block.action.href}>{block.action.label}</ButtonLink> : null}
      {back}
    </Card> : <form action={formAction} onSubmit={handleSubmit}>
      <input name="amount" type="hidden" value={formatNaira(amountKobo, true).slice(1).replaceAll(",", "")}/>
      <input name="documentId" type="hidden" value={document.id}/>
      <Card className="mb-4">
        <SectionTitle icon="calculate">Calculated fee</SectionTitle>
        <DetailList>
          <DetailRow label="Document Type" value={document.label}/>
          <DetailRow label={document.basisLabel} value={formatNaira(amountKobo)}/>
          <DetailRow emphasise label="Client pays into branch account" value={formatNaira(fee.professionalFeeKobo)}/>
          <DetailRow label="Less 2% branch fee" value={formatNaira(fee.branchFeeKobo)}/>
          <DetailRow label="Branch sends to you" value={formatNaira(fee.netFeeKobo)}/>
        </DetailList>
      </Card>
      <Card className="mb-4">
        <SectionTitle icon="groups">Parties</SectionTitle>
        <TextField error={partiesError || state.fieldErrors.parties} hint="This appears on the invoice and on your Certificate of Compliance, so use the names as they appear on the instrument." id="parties" label="Parties to the Document" maxLength={160} multiline name="parties" onChange={(event) => { setParties(event.target.value); setPartiesError(""); }} placeholder="e.g. Chinedu Okafor to Adeola Properties Ltd" value={parties}/>
      </Card>
      {state.status === "error" && state.message ? <Notice className="mb-4" tone="error">{state.message}{state.requiresReview ? <> <Link className="font-semibold underline" href="/transactions">Check Transactions</Link></> : null}</Notice> : null}
      <Button disabled={state.requiresReview} loading={pending} type="submit">Generate Invoice</Button>
      <p className="mt-3 text-center text-caption leading-[17px] text-text-muted">Generating an invoice does not pay anything. It creates the reference your client quotes on their bank transfer to the branch.</p>
      {back}
    </form>}
  </>;
}
