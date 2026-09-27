import { notFound } from "next/navigation";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { FormNotice } from "@/components/ui/form-notice";
import { isUuid } from "@/lib/calculator/contracts";
import { loadTransactions } from "@/lib/transactions/live-transaction";
import { findSampleTransaction } from "@/lib/transactions/sample-transactions";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = findSampleTransaction(id);
  if (sample) return <TransactionDetail transaction={sample}/>;
  if (!isUuid(id)) notFound();
  const result = await loadTransactions(id);
  if (result.error) return <TransactionShell><main className="mx-auto max-w-[850px] p-4"><FormNotice tone="error">{result.error}</FormNotice></main></TransactionShell>;
  const transaction = result.transactions[0];
  if (!transaction) notFound();
  return <TransactionDetail transaction={transaction} live/>;
}
