import { TransactionsList } from "@/components/transactions/transactions-list";
import { loadTransactionPage } from "@/lib/transactions/live-transaction";

export default async function TransactionsPage() {
  const page = await loadTransactionPage({ q: "", status: null }, null);
  return <TransactionsList initial={page}/>;
}
