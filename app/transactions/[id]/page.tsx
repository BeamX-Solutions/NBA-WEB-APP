import { notFound } from "next/navigation";
import { AppShell } from "@/components/mobile/app-shell";
import { ButtonLink } from "@/components/mobile/button";
import { Screen } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { isUuid } from "@/lib/calculator/contracts";
import { loadTransactions } from "@/lib/transactions/live-transaction";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const result = await loadTransactions(id);
  if (result.error) return <AppShell><Screen><ErrorState action={<ButtonLink href="/transactions" variant="outline">Back to Transactions</ButtonLink>} body={result.error} title="This transaction could not be loaded"/></Screen></AppShell>;
  const transaction = result.transactions[0];
  if (!transaction) notFound();
  return <AppShell><TransactionDetail transaction={transaction}/></AppShell>;
}
