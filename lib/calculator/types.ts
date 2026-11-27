export type CalculatorBranch = {
  /** Whether the branch lets its practitioners invoice a Power of Attorney at the agreed fee (NBA APP 20261127100000). */
  acceptsPoaInvoices: boolean;
  accountName: string | null;
  accountNumber: string | null;
  activationStatus: string;
  bankName: string | null;
  name: string;
  state: string | null;
};

export type CalculatorSubscription = {
  expiresAt: string;
  isCurrent: boolean;
  plan: string;
  startsAt: string;
  status: string;
};

export type CalculatorContext = {
  branch: CalculatorBranch | null;
  displayName: string;
  firstName: string;
  /** The branch sends the practitioner's share here; create_transaction refuses an invoice without it. */
  hasBankDetails: boolean;
  scn: string | null;
  loadWarning: string | null;
  subscription: CalculatorSubscription | null;
};

export type InvoiceFieldErrors = {
  amount?: string;
  document?: string;
  parties?: string;
  propertyDescription?: string;
};

export type CreateInvoiceActionState = {
  fieldErrors: InvoiceFieldErrors;
  requiresReview?: boolean;
  message: string;
  status: "error" | "idle" | "success";
  transaction: {
    id: string;
    invoiceNumber: string;
  } | null;
};
