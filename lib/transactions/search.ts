import { databaseDocumentTypes, type DatabaseDocumentType } from "../calculator/contracts.ts";
import { DOCUMENT_TYPES } from "../fees/legal-fees.ts";

/**
 * Turning the Transactions screen's search box and status filter into database filters, so they
 * search the whole history rather than the rows already loaded.
 */

export type TransactionFilters = { q: string; status: DatabaseTransactionStatus | null };

export type DatabaseTransactionStatus = "awaiting_payment" | "pending_verification" | "verified" | "rejected";

/** The screen's filter values (lib/transactions/sample-transactions statusLabels keys) to the enum. */
const statusFilters: Record<string, DatabaseTransactionStatus> = {
  awaiting: "awaiting_payment",
  pending: "pending_verification",
  verified: "verified",
  rejected: "rejected",
};

export const MAX_SEARCH_LENGTH = 80;

export function statusFilter(value: unknown): DatabaseTransactionStatus | null {
  return typeof value === "string" && Object.hasOwn(statusFilters, value) ? statusFilters[value] : null;
}

/**
 * The term as it may reach a PostgREST filter: characters that structure a filter (`,()"'\`) or act
 * as wildcards (`%_*`) are removed, whitespace is collapsed, and the length is capped.
 */
export function cleanSearchTerm(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[,()"'\\%_*]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH).trim();
}

/** Document types whose label contains the term, as stored: the card shows the label, not the enum. */
export function documentTypesMatching(term: string): DatabaseDocumentType[] {
  const needle = term.toLowerCase();
  if (!needle) return [];
  return DOCUMENT_TYPES
    .filter((type) => type.label.toLowerCase().includes(needle))
    .map((type) => databaseDocumentTypes[type.id as keyof typeof databaseDocumentTypes])
    .filter((value): value is DatabaseDocumentType => typeof value === "string");
}

/** The PostgREST `or` filter for a cleaned, non-empty term: invoice number, parties, or document type. */
export function searchFilter(term: string): string {
  const clauses = [`invoice_number.ilike.*${term}*`, `parties.ilike.*${term}*`];
  const types = documentTypesMatching(term);
  if (types.length) clauses.push(`document_type.in.(${types.join(",")})`);
  return clauses.join(",");
}
