import { isUuid } from "../calculator/contracts.ts";
import { asRow, documentTypeLabel, formatLagosDate, money, text } from "./contracts.ts";

/** The client's bill for one transaction, with the account of the branch it was drawn on. */
export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  issuedOn: string;
  canSubmitProof: boolean;
  documentType: string;
  parties: string;
  amountPayable: string;
  branchFee: string;
  dueToPractitioner: string;
  practitioner: string;
  scn: string;
  branch: { name: string; accountName: string | null; accountNumber: string | null; bankName: string | null };
};

export const invoiceColumns = "id, invoice_number, status, document_type, parties, amount_payable, branch_fee, due_to_practitioner, created_at, branches!transactions_branch_id_fkey(name, account_name, account_number, bank_name)";

export function parseInvoice(value: unknown, identity: { name: string; scn: string }): InvoiceRecord | null {
  const row = asRow(value);
  const branch = asRow(Array.isArray(row?.branches) ? row?.branches[0] : row?.branches);
  if (!row || !branch || !isUuid(row.id)) return null;
  const invoiceNumber = text(row.invoice_number);
  const documentType = documentTypeLabel(row.document_type);
  const issuedAt = formatLagosDate(row.created_at);
  const issuedOn = formatLagosDate(row.created_at, "long");
  const amountPayable = money(row.amount_payable);
  const branchFee = money(row.branch_fee);
  const dueToPractitioner = money(row.due_to_practitioner);
  const branchName = text(branch.name);
  const parties = text(row.parties);
  if (!invoiceNumber || !documentType || !issuedAt || !issuedOn || !amountPayable || !branchFee || !dueToPractitioner || !branchName || !parties) return null;
  const accountName = text(branch.account_name);
  const accountNumber = text(branch.account_number);
  const bankName = text(branch.bank_name);
  const complete = Boolean(accountName && accountNumber && bankName);
  return {
    id: row.id, invoiceNumber, issuedAt, issuedOn, documentType, parties, amountPayable, branchFee, dueToPractitioner,
    canSubmitProof: row.status === "awaiting_payment" || row.status === "rejected",
    practitioner: identity.name, scn: identity.scn,
    // Partial details are treated as none: an incomplete account is one nobody can pay into.
    branch: { name: branchName, accountName: complete ? accountName : null, accountNumber: complete ? accountNumber : null, bankName: complete ? bankName : null },
  };
}

/** Written for the client, who is the one paying. Mirrors the mobile share message. */
export function invoiceShareText(invoice: InvoiceRecord): string {
  const { branch } = invoice;
  const payee = branch.accountName ?? branch.name;
  const account = branch.accountNumber ? `, account ${branch.accountNumber}` : "";
  const bank = branch.bankName ? `, ${branch.bankName}` : "";
  return `Invoice ${invoice.invoiceNumber}: please pay ${invoice.amountPayable} to ${payee}${account}${bank}. Quote the reference.`;
}
