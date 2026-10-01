import { DOCUMENT_TYPES, parseNairaToKobo, type DocumentType } from "../fees/legal-fees.ts";
import type { InvoiceFieldErrors } from "./types.ts";

export const databaseDocumentTypes = {
  "contract-of-sale": "contract_of_sale",
  "deed-of-assignment": "deed_of_assignment",
  "deed-of-conveyance": "deed_of_conveyance",
  "deed-of-exchange": "deed_of_exchange",
  "deed-of-gift": "deed_of_gift",
  "deed-of-lease": "deed_of_lease",
  "deed-of-sub-lease": "deed_of_sub_lease",
  "deed-of-surrender": "deed_of_surrender",
  "irrevocable-power-of-attorney": "power_of_attorney",
  "mortgage-deed": "mortgage_deed",
  "mortgage-release": "deed_of_release",
  "tenancy-agreement": "tenancy_agreement",
} as const;

export type DatabaseDocumentType = (typeof databaseDocumentTypes)[keyof typeof databaseDocumentTypes];

export type ValidatedInvoiceInput = {
  amountKobo: bigint;
  databaseDocumentType: DatabaseDocumentType;
  document: DocumentType;
  parties: string;
};

export function documentById(id: string): DocumentType | null {
  return DOCUMENT_TYPES.find((document) => document.id === id) ?? null;
}

export function validateInvoiceInput(input: {
  amount: string;
  documentId: string;
  parties: string;
}): { data: ValidatedInvoiceInput | null; fieldErrors: InvoiceFieldErrors } {
  const fieldErrors: InvoiceFieldErrors = {};
  const document = documentById(input.documentId);
  const amountKobo = parseNairaToKobo(input.amount);
  const parties = input.parties.trim();

  if (!document || !(document.id in databaseDocumentTypes)) fieldErrors.document = "Select a valid document or transaction type.";
  else if (document.scale === "discretionary") fieldErrors.document = `${document.label} is not covered by Scale 4, so no invoice can be generated for it.`;
  if (amountKobo === null) fieldErrors.amount = "Enter an amount above ₦0 and no more than ₦1 trillion.";
  if (!parties) fieldErrors.parties = "Enter the parties to the document.";
  else if (parties.length > 160) fieldErrors.parties = "Parties to the document must be 160 characters or fewer.";

  if (Object.keys(fieldErrors).length > 0 || !document || amountKobo === null) return { data: null, fieldErrors };

  return {
    data: {
      amountKobo,
      databaseDocumentType: databaseDocumentTypes[document.id as keyof typeof databaseDocumentTypes],
      document,
      parties,
    },
    fieldErrors: {},
  };
}

export function safeInvoiceErrorMessage(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message.toLowerCase()
    : "";

  if (message.includes("signed in") || message.includes("jwt") || message.includes("session")) {
    return "Your session expired. Log in again before creating an invoice.";
  }
  if (message.includes("profile not found")) {
    return "Your practitioner profile is not available. Contact your branch administrator.";
  }
  if (message.includes("administrator accounts")) {
    return "Administrator accounts cannot create invoices. Use a practitioner account.";
  }
  if (message.includes("approved your membership")) {
    return "Your branch has not approved your membership yet, so you cannot create an invoice.";
  }
  if (message.includes("bank details")) {
    return "Add your bank details in Edit Profile before creating an invoice. Your branch sends your fee to that account.";
  }
  if (message.includes("branch fee does not match")) {
    return "The fee could not be confirmed. Recalculate and try again.";
  }
  if (message.includes("not currently active") || message.includes("branch") && message.includes("activation")) {
    return "Your branch is not currently active for invoice issuance. You can continue to use the fee calculator.";
  }
  if (message.includes("subscription") || message.includes("entitlement")) {
    return "An active subscription is required to create an invoice. Your fee calculation is still available.";
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
    return "The invoice could not be created because the service is unreachable. Check your connection and try again.";
  }
  return "The invoice could not be created. Review the details and try again.";
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
