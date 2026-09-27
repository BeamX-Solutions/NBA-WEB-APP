import { DOCUMENT_TYPES, formatNaira } from "../fees/legal-fees.ts";
import { databaseDocumentTypes, isUuid } from "../calculator/contracts.ts";
import type { TransactionStatus } from "./sample-transactions.ts";

export type TransactionRecord = {
  id: string;
  invoiceNumber: string;
  documentType: string;
  date: string;
  status: TransactionStatus;
  parties: string;
  consideration: string;
  professionalFee: string;
  amountPayable: string;
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

export function money(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  return /^\d+$/.test(String(value)) ? formatNaira(BigInt(value)) : null;
}

export function canSubmitProof(status: unknown): boolean {
  return status === "awaiting_payment" || status === "rejected";
}

export function parseTransaction(value: unknown, identity: { name: string; scn: string }): TransactionRecord | null {
  const row = asRow(value);
  if (!row || !isUuid(row.id)) return null;
  const statuses: Record<string, TransactionStatus> = { awaiting_payment: "awaiting", pending_verification: "pending", rejected: "rejected", verified: "verified" };
  const status = Object.hasOwn(statuses, String(row.status)) ? statuses[String(row.status)] : null;
  const invoiceNumber = text(row.invoice_number);
  const document = DOCUMENT_TYPES.find(item => databaseDocumentTypes[item.id as keyof typeof databaseDocumentTypes] === row.document_type);
  if (!status || !invoiceNumber || !document) return null;
  const calculation = asRow(row.calculations);
  const createdAt = new Date(String(row.created_at));
  return {
    id: row.id,
    invoiceNumber,
    documentType: document.label,
    date: Number.isNaN(createdAt.getTime()) ? "Unavailable" : new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos" }).format(createdAt),
    status,
    parties: text(row.parties) ?? "Unavailable",
    consideration: money(row.consideration) ?? "Unavailable",
    professionalFee: money(calculation?.professional_fee) ?? "Unavailable",
    amountPayable: money(row.amount_payable) ?? "Unavailable",
    practitioner: identity.name,
    scn: identity.scn,
    rbin: text(row.rbin) ?? undefined,
    rejectionReason: text(row.rejection_reason) ?? undefined,
  };
}
