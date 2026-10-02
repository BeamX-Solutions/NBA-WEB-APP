import "server-only";
import { afterCursorFilter, encodeCursor, PAGE_SIZE, pageOf, type Cursor } from "@/lib/paging";
import { loadPractitionerIdentity } from "@/lib/practitioner/identity";
import { requireSession } from "@/lib/supabase/request";
import { parseTransaction, type TransactionRecord } from "./contracts";
import { invoiceColumns, parseInvoice, type InvoiceRecord } from "./invoice";
import { searchFilter, type TransactionFilters } from "./search";

const transactionColumns = "id, invoice_number, document_type, consideration, amount_payable, branch_fee, due_to_practitioner, remitted_at, remitted_to, remittance_reference, parties, status, rbin, rejection_reason, created_at";
const loadError = "Your transactions could not be loaded. Refresh the page and try again.";
const readError = "A transaction could not be read. Contact your branch before making a payment.";

export type TransactionPage = { transactions: TransactionRecord[]; nextCursor: string | null; error: string | null };

type Row = Record<string, unknown> & { id?: unknown; created_at?: unknown };

function cursorOf(row: Row): string | null {
  return typeof row.created_at === "string" && typeof row.id === "string" ? encodeCursor(row.created_at, row.id) : null;
}

/**
 * One page of the practitioner's transactions, newest first, with the screen's search and status
 * filter applied in the database. `filters.q` must already be cleaned (lib/transactions/search).
 */
export async function loadTransactionPage(filters: TransactionFilters, cursor: Cursor | null): Promise<TransactionPage> {
  const { client, user } = await requireSession("/transactions");
  try {
    // Owner filter is explicit: RLS would also let a branch administrator read the whole branch.
    let query = client.from("transactions").select(transactionColumns).eq("user_id", user.id);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.q) query = query.or(searchFilter(filters.q));
    if (cursor) query = query.or(afterCursorFilter("created_at", cursor));
    const [result, identity] = await Promise.all([
      query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE + 1),
      loadPractitionerIdentity(user.id),
    ]);
    if (result.error) return { transactions: [], nextCursor: null, error: loadError };
    const page = pageOf((result.data ?? []) as Row[], cursorOf);
    const names = { name: identity.name ?? "Unavailable", scn: identity.scn ?? "Unavailable" };
    const transactions: TransactionRecord[] = [];
    for (const row of page.rows) {
      const transaction = parseTransaction(row, names);
      if (!transaction) return { transactions: [], nextCursor: null, error: readError };
      transactions.push(transaction);
    }
    return { transactions, nextCursor: page.nextCursor, error: null };
  } catch { return { transactions: [], nextCursor: null, error: loadError }; }
}

/** One of the practitioner's transactions, or null when it is not theirs or does not exist. */
export async function loadTransaction(id: string): Promise<{ transaction: TransactionRecord | null; error: string | null }> {
  const { client, user } = await requireSession(`/transactions/${id}`);
  try {
    const [result, identity] = await Promise.all([
      client.from("transactions").select(transactionColumns).eq("id", id).eq("user_id", user.id).maybeSingle(),
      loadPractitionerIdentity(user.id),
    ]);
    if (result.error) return { transaction: null, error: loadError };
    if (!result.data) return { transaction: null, error: null };
    const transaction = parseTransaction(result.data, { name: identity.name ?? "Unavailable", scn: identity.scn ?? "Unavailable" });
    return transaction ? { transaction, error: null } : { transaction: null, error: readError };
  } catch { return { transaction: null, error: loadError }; }
}

export type InvoiceLoad = { invoice: InvoiceRecord | null; error: string | null };

/** Owner-scoped invoice with the branch the transaction was drawn on, not the user's current branch. */
export async function loadInvoice(id: string): Promise<InvoiceLoad> {
  const { client, user } = await requireSession(`/transactions/${id}/invoice`);
  try {
    const [result, identity] = await Promise.all([
      client.from("transactions").select(invoiceColumns).eq("id", id).eq("user_id", user.id).maybeSingle(),
      loadPractitionerIdentity(user.id),
    ]);
    if (result.error) return { invoice: null, error: "This invoice could not be loaded. Refresh the page and try again." };
    if (!result.data) return { invoice: null, error: null };
    const invoice = parseInvoice(result.data, { name: identity.name ?? "Unavailable", scn: identity.scn ?? "Not recorded" });
    return invoice ? { invoice, error: null } : { invoice: null, error: "This invoice could not be read. Contact your branch before your client pays." };
  } catch { return { invoice: null, error: "This invoice could not be loaded. Refresh the page and try again." }; }
}
