import { isUuid } from "../calculator/contracts.ts";
import { asRow, documentTypeLabel, formatLagosDate, money, text } from "../transactions/contracts.ts";

/**
 * The two halves of a practitioner's money, for the Payments screen.
 *
 * Pay-in is the client paying the professional fee into the branch account, and the branch
 * verifying it. Payout is the branch sending the practitioner their share. A payout is Confirmed
 * once the branch records the transfer with the bank's receipt; that is the confirmation, decided
 * with the client on 20 October 2026, and the practitioner has no step to take.
 *
 * Mirrors NBA APP mobile/lib/payments.ts. If one changes, so must the other.
 */

export type Tone = "success" | "warning" | "neutral" | "danger";
export type Status = { label: string; tone: Tone };

export type PaymentRecord = {
  id: string;
  invoiceNumber: string;
  documentType: string;
  date: string;
  /** The practitioner's share: what the branch sends on. */
  amount: string;
  payIn: Status;
  /** Null until the client's payment is verified: there is nothing to pay out before then. */
  payout: Status | null;
  hasReceipt: boolean;
  /** Raw share in kobo, for the summary totals. */
  shareKobo: bigint;
};

const payInStatuses: Record<string, Status> = {
  awaiting_payment: { label: "Awaiting payment", tone: "warning" },
  pending_verification: { label: "Being verified", tone: "neutral" },
  verified: { label: "Received", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function payInStatus(status: unknown): Status | null {
  return typeof status === "string" && Object.hasOwn(payInStatuses, status) ? payInStatuses[status] : null;
}

export function payoutStatus(status: unknown, due: bigint, remittedAt: unknown): Status | null {
  if (status !== "verified" || due <= 0n) return null;
  return typeof remittedAt === "string" ? { label: "Confirmed", tone: "success" } : { label: "Pending", tone: "warning" };
}

function kobo(value: unknown): bigint | null {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  return (typeof value === "string" || typeof value === "number") && /^\d+$/.test(String(value)) ? BigInt(value) : null;
}

/** One row of the signed-in practitioner's transactions, with its payout's receipt if any. */
export function parsePaymentRow(value: unknown): PaymentRecord | null {
  const row = asRow(value);
  if (!row || !isUuid(row.id)) return null;
  const payIn = payInStatus(row.status);
  const documentType = documentTypeLabel(row.document_type);
  const share = kobo(row.due_to_practitioner);
  const amount = money(row.due_to_practitioner);
  if (!payIn || !documentType || share === null || amount === null) return null;
  return {
    id: row.id,
    invoiceNumber: text(row.invoice_number) ?? "No reference yet",
    documentType,
    date: formatLagosDate(row.created_at) ?? "Unavailable",
    amount,
    payIn,
    payout: payoutStatus(row.status, share, row.remitted_at),
    hasReceipt: text(asRow(row.payouts)?.receipt_path) !== null,
    shareKobo: share,
  };
}
