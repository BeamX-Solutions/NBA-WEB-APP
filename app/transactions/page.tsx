import { AppShell } from "@/components/mobile/app-shell";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { loadTransactions } from "@/lib/transactions/live-transaction";

export default async function TransactionsPage() {
  const result = await loadTransactions();
  return <AppShell tabs><TransactionsList error={result.error} transactions={result.transactions}/></AppShell>;
}
