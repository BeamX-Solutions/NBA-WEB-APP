"use server";

import { parseCursor } from "@/lib/paging";
import { loadTransactionPage, type TransactionPage } from "@/lib/transactions/live-transaction";
import { cleanSearchTerm, statusFilter } from "@/lib/transactions/search";

/**
 * A page of the practitioner's transactions for the list's search, status filter and Load more.
 * Every input comes from the browser, so each is checked before it reaches a query. A cursor that
 * does not parse ends the list rather than restarting it, which would repeat rows.
 */
export async function loadTransactionsAction(input: { q?: unknown; status?: unknown; cursor?: unknown }): Promise<TransactionPage> {
  const cursor = input?.cursor === undefined || input.cursor === null ? null : parseCursor(input.cursor);
  if (input?.cursor != null && cursor === null) return { transactions: [], nextCursor: null, error: null };
  return loadTransactionPage({ q: cleanSearchTerm(input?.q), status: statusFilter(input?.status) }, cursor);
}
