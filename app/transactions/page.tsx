import { TransactionsList } from "@/components/transactions/transactions-list";
import { loadTransactions } from "@/lib/transactions/live-transaction";

export default async function TransactionsPage() {
  const result = await loadTransactions();
  return <TransactionsList transactions={result.transactions} error={result.error}/>;
}
