import { notFound } from "next/navigation";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { findSampleTransaction } from "@/lib/transactions/sample-transactions";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = findSampleTransaction(id);
  if (!transaction) notFound();
  return <TransactionDetail transaction={transaction}/>;
}
