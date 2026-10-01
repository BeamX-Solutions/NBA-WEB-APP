import { DOCUMENT_TYPES, formatNaira } from "../fees/legal-fees.ts";
import { databaseDocumentTypes, isUuid } from "../calculator/contracts.ts";
import type { TransactionStatus } from "./sample-transactions.ts";

/** The branch's record of sending the practitioner their share. Moves no money; set only by record_remittance. */
export type Remittance = {
  remittedOn: string;
  account: string;
  reference: string | null;
};

export type TransactionRecord = {
  id: string;
  invoiceNumber: string;
  documentType: string;
  date: string;
  status: TransactionStatus;
  parties: string;
  consideration: string;
  /** What the client pays into the branch account: the professional fee. */
  amountPayable: string;
  branchFee: string;
  dueToPractitioner: string;
  /** True once there is anything for the branch to send on. */
  hasDueToPractitioner: boolean;
  remittance: Remittance | null;
  practitioner: string;
  scn: string;
  rbin?: string;
  rejectionReason?: string;
};

export function asRow(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function kobo(value: unknown): bigint | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  return /^\d+$/.test(String(value)) ? BigInt(value) : null;
}

export function money(value: unknown): string | null {
  const amount = kobo(value);
  return amount === null ? null : formatNaira(amount);
}

export function formatLagosDate(value: unknown, style: "short" | "long" = "short"): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = style === "long" ? { timeZone: "Africa/Lagos", day: "numeric", month: "long", year: "numeric" } : { timeZone: "Africa/Lagos" };
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

export function documentTypeLabel(value: unknown): string | null {
  return DOCUMENT_TYPES.find(item => databaseDocumentTypes[item.id as keyof typeof databaseDocumentTypes] === value)?.label ?? null;
}

export function canSubmitProof(status: unknown): boolean {
  return status === "awaiting_payment" || status === "rejected";
}

function parseRemittance(row: Record<string, unknown>): Remittance | null {
  const remittedOn = formatLagosDate(row.remitted_at, "long");
  const account = text(row.remitted_to);
  return remittedOn && account ? { remittedOn, account, reference: text(row.remittance_reference) } : null;
}

export function parseTransaction(value: unknown, identity: { name: string; scn: string }): TransactionRecord | null {
  const row = asRow(value);
  if (!row || !isUuid(row.id)) return null;
  const statuses: Record<string, TransactionStatus> = { awaiting_payment: "awaiting", pending_verification: "pending", rejected: "rejected", verified: "verified" };
  const status = Object.hasOwn(statuses, String(row.status)) ? statuses[String(row.status)] : null;
  const invoiceNumber = text(row.invoice_number);
  const documentType = documentTypeLabel(row.document_type);
  if (!status || !invoiceNumber || !documentType) return null;
  const due = kobo(row.due_to_practitioner);
  return {
    id: row.id,
    invoiceNumber,
    documentType,
    date: formatLagosDate(row.created_at) ?? "Unavailable",
    status,
    parties: text(row.parties) ?? "Unavailable",
    consideration: money(row.consideration) ?? "Unavailable",
    amountPayable: money(row.amount_payable) ?? "Unavailable",
    branchFee: money(row.branch_fee) ?? "Unavailable",
    dueToPractitioner: due === null ? "Unavailable" : formatNaira(due),
    hasDueToPractitioner: due !== null && due > 0n,
    remittance: parseRemittance(row),
    practitioner: identity.name,
    scn: identity.scn,
    rbin: text(row.rbin) ?? undefined,
    rejectionReason: text(row.rejection_reason) ?? undefined,
  };
}
