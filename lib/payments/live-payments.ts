import "server-only";
import { requireSession } from "@/lib/supabase/request";
import { parsePaymentRow, type PaymentRecord } from "./contracts";

const columns = "id, invoice_number, document_type, status, due_to_practitioner, remitted_at, created_at, payouts(receipt_path)";
/** A practitioner's invoices are counted in tens, not thousands. */
const limit = 200;
const loadError = "Your payments could not be loaded. Refresh the page and try again.";

export type PaymentsLoad = { payments: PaymentRecord[]; error: string | null };

/** The signed-in practitioner's invoices, newest first, each with both payment statuses. */
export async function loadPayments(): Promise<PaymentsLoad> {
  const { client, user } = await requireSession("/payments");
  try {
    // Owner filter is explicit: RLS would also let a branch administrator read the whole branch.
    const result = await client.from("transactions").select(columns).eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
    if (result.error) return { payments: [], error: loadError };
    const payments: PaymentRecord[] = [];
    for (const row of result.data ?? []) {
      const payment = parsePaymentRow(row);
      if (!payment) return { payments: [], error: "A payment could not be read. Contact your branch." };
      payments.push(payment);
    }
    return { payments, error: null };
  } catch { return { payments: [], error: loadError }; }
}
