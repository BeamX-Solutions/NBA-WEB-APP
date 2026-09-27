"use client";

import Link from "next/link";
import Image from "next/image";
import {
  type FormEvent,
  type ReactNode,
  useActionState,
  useState,
  useRef,
} from "react";

import { createInvoiceAction } from "@/app/calculator-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormNotice } from "@/components/ui/form-notice";
import type {
  CalculatorContext,
  CreateInvoiceActionState,
} from "@/lib/calculator/types";
import {
  createTermsPdf,
  downloadPdf,
  validateText,
} from "@/lib/preview/documents";
import {
  formatNaira,
  type DocumentType,
  type FeeBreakdown,
} from "@/lib/fees/legal-fees";

type PowerOfAttorneyBasis = "property-transfer" | "other" | "";
type Calculation = {
  amountKobo: bigint;
  document: DocumentType;
  fee: FeeBreakdown;
};

const greenButton =
  "reference-primary inline-flex items-center justify-center min-h-[51px] w-full rounded-[9px] bg-[#0b5933] px-4 text-[15px] font-semibold text-white shadow-none hover:bg-[#084829] focus-visible:outline-2 focus-visible:outline-nba-focus focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const outlineButton =
  "reference-outline inline-flex items-center justify-center min-h-[53px] w-full rounded-[9px] border-[1.5px] border-[#0b5933] bg-white px-4 text-[15px] font-semibold text-[#0b5933] shadow-none hover:bg-[#f1f4f1] focus-visible:outline-2 focus-visible:outline-nba-focus focus-visible:outline-offset-2";
const labelClass = "mb-[10px] block text-[13px] font-bold text-[#202220]";
const inputClass =
  "min-h-[64px] w-full resize-y rounded-[9px] border border-[#cdd1cd] bg-white px-3 py-3 text-base text-[#202220] outline-none placeholder:text-[#9a9fa7] focus:border-[#8c969b] focus:ring-2 focus:ring-[#8c969b]/20";
const referenceCard = "reference-card rounded-[13px] border-[#e0e3e0] bg-white p-4 shadow-none";

const initialInvoiceState: CreateInvoiceActionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
  transaction: null,
};

function SectionTitle({ children, icon }: { children: ReactNode; icon?: "terms" | "fee" | "parties" | "bank" }) {
  return (
    <h2 className="mb-4 flex items-center gap-[9px] font-serif text-[17px] font-bold text-[#21613c]">
      {icon ? <svg aria-hidden="true" className="size-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        {icon === "terms" ? <path d="m2 9 10-7 10 7v12H2V9Zm2 0 8 5 8-5-8-5-8 5Z"/> : icon === "bank" ? <path d="m12 2 10 5v2H2V7l10-5ZM4 11h3v8H4v-8Zm6 0h4v8h-4v-8Zm7 0h3v8h-3v-8ZM2 20h20v2H2v-2Z"/> : icon === "parties" ? <><circle cx="12" cy="6" r="4"/><circle cx="3" cy="9" r="2.5"/><circle cx="21" cy="9" r="2.5"/><path d="M5 21v-3a7 7 0 0 1 14 0v3H5ZM0 20v-4a4 4 0 0 1 4-4l2 1-3 7H0Zm21 0-3-7 2-1a4 4 0 0 1 4 4v4h-3Z"/></> : <><rect height="20" rx="2" width="20" x="2" y="2"/><path d="M6 7h5m-2.5 7v5M6 16.5h5m4-3h4m-4 4h4m-4-8 4-4m-4 0 4 4" stroke="white" strokeWidth="1.5"/></>}
      </svg> : null}
      {children}
    </h2>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#eceeee] py-[9px]">
      <dt className="text-xs uppercase tracking-[.04em] text-[#6c727c]">{label}</dt>
      <dd className="m-0 wrap-break-word text-[15px] leading-[1.4] text-[#202220]">
        {value}
      </dd>
    </div>
  );
}

export function TermsCard({ calculation, context }: { calculation: Calculation; context: CalculatorContext }) {
  const [clientName, setClientName] = useState("");
  const [matterDescription, setMatterDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const handleDownload = async () => {
    const clientError = validateText(clientName, "Client name");
    const matterError = validateText(matterDescription, "Matter description");

    if (clientError || matterError) {
      setError(clientError ?? matterError ?? "Review the document details.");
      return;
    }

    setError("");
    setMessage("");
    setWorking(true);
    try {
      const pdf = await createTermsPdf(
        calculation,
        clientName.trim(),
        matterDescription.trim(),
        { name: context.displayName, scn: context.scn, branch: context.branch?.name ?? null },
      );
      downloadPdf(
        pdf,
        `terms-of-engagement-${clientName.trim().replaceAll(/\s+/g, "-").toLowerCase()}.pdf`,
      );
      setMessage("Terms of engagement PDF downloaded.");
    } catch {
      setError("The terms document could not be generated. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card className={`${referenceCard} space-y-4`} padding="none">
      <div className="space-y-1">
        <SectionTitle icon="terms">Terms of Engagement</SectionTitle>
        <p className="text-xs leading-[1.5] text-[#6c727c]">
          The Legal Practitioners (Remuneration) Order, 2023 requires written terms to reach your client within 14 days of accepting instructions. This produces them from the calculation above.
        </p>
      </div>

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <div className="grid gap-[18px]">
        <label className="block">
          <span className={labelClass}>Client</span>
          <input
            className={inputClass.replace("min-h-[64px]", "min-h-[50px]")}
            maxLength={160}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Name of the client instructing you"
            value={clientName}
          />
        </label>

        <label className="block">
          <span className={labelClass}>The matter</span>
          <input
            className={inputClass.replace("min-h-[64px]", "min-h-[50px]")}
            maxLength={160}
            onChange={(event) => setMatterDescription(event.target.value)}
            placeholder="e.g. the sale of the property at 12 Ziks Avenue"
            value={matterDescription}
          />
        </label>
      </div>

      <Button
        className={outlineButton}
        loading={working}
        onClick={handleDownload}
        type="button"
      >
        Generate Terms of Engagement
      </Button>
      <p aria-live="polite" className="text-xs text-[#6c727c] empty:hidden">
        {message}
      </p>
    </Card>
  );
}

function inputAmount(amountKobo: bigint) {
  return formatNaira(amountKobo, true).slice(1).replaceAll(",", "");
}

function invoiceBlockReason(context: CalculatorContext) {
  if (context.loadWarning) {
    return context.loadWarning;
  }

  if (!context.branch) {
    return "Your profile is not linked to a branch. Contact support before creating an invoice.";
  }

  if (context.branch.activationStatus !== "active") {
    return "Your branch is not active for invoice creation. You can still use the calculator.";
  }

  if (!context.subscription?.isCurrent) {
    return "An active subscription is required to create an invoice. You can still use the calculator.";
  }

  return null;
}

export function InvoiceFlow({
  calculation,
  context,
  onBack,
  poaBasis,
}: {
  calculation: Calculation;
  context: CalculatorContext;
  onBack: () => void;
  poaBasis: PowerOfAttorneyBasis;
}) {
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
  const [localError, setLocalError] = useState("");
  const blockReason = invoiceBlockReason(context);
  const branch = context.branch;
  const { amountKobo, document, fee } = calculation;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const partiesError = validateText(parties, "Parties or particulars");

    if (pending || submittingRef.current || state.requiresReview) { event.preventDefault(); return; }
    if (blockReason || partiesError) {
      event.preventDefault();
      setLocalError(partiesError || blockReason || "Unable to create invoice.");
      return;
    }

    submittingRef.current = true;
    setLocalError("");
  };

  if (state.status === "success" && state.transaction) {
    const hasBankDetails = Boolean(
      branch?.accountName && branch.accountNumber && branch.bankName,
    );

    return (
      <div className="space-y-4">
        <div className="mb-5">
          <h1 className="font-serif text-[26px] leading-[1.2] font-bold">Branch Fee Invoice</h1>
          <p className="mt-2 text-[15px] leading-[1.45] text-[#6c727c]">Pay this amount to your branch, then upload the payment slip.</p>
        </div>
        <FormNotice tone="success">
          The invoice was created successfully. Payment verification happens
          after proof is submitted from the transaction page.
        </FormNotice>
        <Card className={referenceCard} padding="none">
          <div className="mb-2 flex items-center gap-3 border-b border-[#e0e3e0] pb-3">
            <Image alt="NBA" height={44} src="/nba-seal.png" width={44}/>
            <div><h2 className="text-[15px] font-bold text-[#21613c]">{branch?.name ?? "NBA Legal Fees"}</h2><p className="mt-1 text-xs text-[#6c727c]">NBA Legal Fees</p></div>
          </div>
          <dl>
            <DataRow label="Legal practitioner" value={context.displayName}/>
            <DataRow label="Reference" value={state.transaction.invoiceNumber}/>
            <DataRow label="Document type" value={document.label}/>
            <DataRow label="Parties" value={parties.trim()}/>
            <DataRow label="Consideration" value={formatNaira(amountKobo)}/>
            <DataRow label="Total payable" value={state.transaction.amountPayable ?? "Unavailable — check your transaction before paying"}/>
          </dl>
        </Card>
        {hasBankDetails && branch ? (
          <Card className={referenceCard} padding="none">
            <SectionTitle icon="bank">Pay into this account</SectionTitle>
            <dl className="border-t border-[#e0e3e0]">
              <DataRow label="Account name" value={branch.accountName ?? ""}/>
              <DataRow label="Account number" value={branch.accountNumber ?? ""}/>
              <DataRow label="Bank" value={branch.bankName ?? ""}/>
              <DataRow label="Use this reference" value={state.transaction.invoiceNumber}/>
            </dl>
            <p className="mt-3 rounded-[9px] bg-[#fff5d3] p-3 text-xs leading-[1.5] text-[#86601a]">Quote the reference on your transfer. Without it your branch may not be able to match the payment to this transaction.</p>
          </Card>
        ) : (
          <FormNotice tone="info">
            Bank details are not available for your branch. Contact your
            branch before making a payment.
          </FormNotice>
        )}
        <Link className={greenButton} href={`/transactions/${state.transaction.id}`}>View transaction</Link>
        <button className={outlineButton} onClick={onBack} type="button">Back to calculator</button>
        <TermsCard calculation={calculation} context={context}/>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="mb-5 space-y-2">

          <h1 className="font-serif text-[26px] leading-[1.2] font-bold text-[#202220]">
            Generate Invoice
          </h1>
          <p className="text-[15px] leading-[1.45] text-[#6c727c]">
            Confirm the figures and name the parties. This creates the reference you quote when paying your branch.
          </p>
        </div>

        <Card className={referenceCard} padding="none">
        <SectionTitle icon="fee">Calculated fee</SectionTitle>
        <dl>
          <DataRow label="Document type" value={document.label} />
          <DataRow label="Consideration / purchase price" value={formatNaira(amountKobo)} />
          <DataRow
            label="Professional fee"
            value={formatNaira(fee.primaryFeeKobo)}
          />
          <DataRow label="Payable to your branch" value={formatNaira(fee.branchLevyKobo)} />
        </dl>
        </Card>

        {blockReason ? <FormNotice tone="error">{blockReason}</FormNotice> : null}
        {state.status === "error" && state.message ? (
          <FormNotice tone="error">{state.message}</FormNotice>
        ) : null}
        {state.requiresReview ? <Link className="text-sm font-semibold text-nba-primary underline" href="/transactions">Check Transactions</Link> : null}
        {localError ? <FormNotice tone="error">{localError}</FormNotice> : null}

        <form action={formAction} className="space-y-5" onSubmit={handleSubmit}>
          <input name="amount" type="hidden" value={inputAmount(amountKobo)} />
          <input name="documentId" type="hidden" value={document.id} />
          <input
            name="poaBasis"
            type="hidden"
            value={document.requiresPropertyTransfer ? poaBasis : ""}
          />

          <Card className={referenceCard} padding="none">
          <SectionTitle icon="parties">Parties</SectionTitle>
          <label className="block" htmlFor="parties">
            <span className={labelClass}>Parties to the Document</span>
            <textarea
              aria-describedby="parties-help parties-error"
              aria-invalid={Boolean(state.fieldErrors.parties || localError)}
              className={`${inputClass} ${
                state.fieldErrors.parties || localError
                  ? "border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]/10"
                  : ""
              }`}
              id="parties"
              maxLength={160}
              name="parties"
              onChange={(event) => {
                setParties(event.target.value);
                setLocalError("");
              }}
              placeholder="e.g. Chinedu Okafor to Adeola Properties Ltd"
              value={parties}
            />
            <span className="mt-2 block text-xs text-[#637469]" id="parties-help">
              This appears on the invoice and on your Certificate of Compliance, so use the names as they appear on the instrument. Maximum 160 characters.
            </span>
            {state.fieldErrors.parties ? (
              <span className="mt-2 block text-sm font-medium text-[#b91c1c]" id="parties-error">
                {state.fieldErrors.parties}
              </span>
            ) : null}
          </label>
          </Card>

          <Button
            className={greenButton}
            disabled={Boolean(blockReason) || pending || state.requiresReview}
            type="submit"
          >
            {pending ? "Creating invoice…" : "Generate Invoice"}
          </Button>
          <p className="text-xs text-[#6c727c]">Total payable: {formatNaira(fee.branchLevyKobo)}{branch ? ` · ${branch.name}` : ""}</p>
          <p className="text-center text-xs leading-[1.5] text-[#6c727c]">Generating an invoice does not pay anything. It creates the reference to quote on your bank transfer to the branch.</p>
        </form>
          <button
            className="text-sm font-semibold text-[#3d7a4f] hover:text-[#175c2f]"
            onClick={onBack}
            type="button"
          >
            ← Back to calculation
          </button>

      <TermsCard calculation={calculation} context={context} />
    </div>
  );
}
