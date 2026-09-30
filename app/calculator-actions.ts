"use server";

import { calculateLegalFee } from "@/lib/fees/legal-fees";
import { isUuid, safeInvoiceErrorMessage, validateInvoiceInput } from "@/lib/calculator/contracts";
import type { CreateInvoiceActionState } from "@/lib/calculator/types";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type RpcRow = { invoice_number?: unknown; transaction_id?: unknown };

function breakdownForRpc(lines: readonly { amountKobo: bigint; label: string }[]): Record<string, string> {
  return Object.fromEntries(lines.map((line) => [line.label, line.amountKobo.toString()]));
}

export async function createInvoiceAction(
  _previous: CreateInvoiceActionState,
  formData: FormData,
): Promise<CreateInvoiceActionState> {
  const validation = validateInvoiceInput({
    amount: String(formData.get("amount") ?? ""),
    documentId: String(formData.get("documentId") ?? ""),
    parties: String(formData.get("parties") ?? ""),
  });
  if (!validation.data) {
    return { fieldErrors: validation.fieldErrors, message: "Review the highlighted details.", status: "error", transaction: null };
  }

  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    return { fieldErrors: {}, message: "Your session expired. Log in again before creating an invoice.", status: "error", transaction: null };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    return { fieldErrors: {}, message: "Your practitioner profile could not be checked. Refresh the page and try again.", status: "error", transaction: null };
  }
  if (!profile) {
    return { fieldErrors: {}, message: "Your practitioner profile is not available. Contact your branch administrator.", status: "error", transaction: null };
  }

  const { amountKobo, databaseDocumentType, document, parties } = validation.data;
  // Recomputed here rather than taken from the browser. create_transaction checks the branch fee again.
  const fee = calculateLegalFee(document, amountKobo);

  let rpcResult: Awaited<ReturnType<typeof client.rpc>>;
  try {
    rpcResult = await client.rpc("create_transaction", {
      p_branch_fee: fee.branchFeeKobo.toString(),
      p_breakdown: breakdownForRpc(fee.lines),
      p_consideration: amountKobo.toString(),
      p_document_type: databaseDocumentType,
      p_parties: parties,
      p_professional_fee: fee.professionalFeeKobo.toString(),
    });
  } catch {
    return { fieldErrors: {}, message: "The invoice response was interrupted. Check Transactions before creating another invoice.", requiresReview: true, status: "error", transaction: null };
  }
  const { data, error } = rpcResult;
  if (error) {
    const requiresReview = !error.code || /fetch|network|connection|timeout/i.test(error.message);
    return { fieldErrors: {}, requiresReview, message: requiresReview ? "The invoice response could not be confirmed. Check Transactions before creating another invoice." : safeInvoiceErrorMessage(error), status: "error", transaction: null };
  }

  const row = Array.isArray(data) ? data[0] as RpcRow | undefined : data as RpcRow | null;
  if (!row || !isUuid(row.transaction_id) || typeof row.invoice_number !== "string" || !row.invoice_number.trim()) {
    return { fieldErrors: {}, requiresReview: true, message: "The invoice was created but its reference could not be confirmed. Check Transactions before trying again.", status: "error", transaction: null };
  }

  revalidatePath("/transactions");
  return {
    fieldErrors: {},
    message: "Invoice created successfully.",
    status: "success",
    transaction: { id: row.transaction_id, invoiceNumber: row.invoice_number.trim() },
  };
}
