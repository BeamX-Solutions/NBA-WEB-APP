import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asRow, parseTransaction, text, type TransactionRecord } from "./contracts";

const transactionColumns = "id, invoice_number, document_type, consideration, amount_payable, parties, status, rbin, rejection_reason, created_at, calculations(professional_fee)";

export async function loadTransactions(id?: string): Promise<{ transactions: TransactionRecord[]; error: string | null }> {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect(`/login?next=${encodeURIComponent(id ? `/transactions/${id}` : "/transactions")}`);
  let query = client.from("transactions").select(transactionColumns).eq("user_id", user.id).order("created_at", { ascending: false });
  if (id) query = query.eq("id", id);
  const [result, profileResult] = await Promise.all([
    query,
    client.from("profiles").select("full_name, scn").eq("id", user.id).maybeSingle(),
  ]);
  if (result.error || profileResult.error) return { transactions: [], error: "Your transactions could not be loaded. Refresh the page and try again." };
  const profile = asRow(profileResult.data);
  const identity = { name: text(profile?.full_name) ?? "Unavailable", scn: text(profile?.scn) ?? "Unavailable" };
  const transactions: TransactionRecord[] = [];
  for (const row of result.data ?? []) {
    const transaction = parseTransaction(row, identity);
    if (!transaction) return { transactions: [], error: "A transaction could not be read. Contact your branch before making a payment." };
    transactions.push(transaction);
  }
  return { transactions, error: null };
}
