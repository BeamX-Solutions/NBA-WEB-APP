import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/mobile/button";
import { Screen } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { isUuid } from "@/lib/calculator/contracts";
import { loadTransaction } from "@/lib/transactions/live-transaction";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const result = await loadTransaction(id);
  if (result.error) return <><Screen><ErrorState action={<ButtonLink href="/transactions" variant="outline">Back to Transactions</ButtonLink>} body={result.error} title="This transaction could not be loaded"/></Screen></>;
  const transaction = result.transaction;
  if (!transaction) notFound();
  return <><TransactionDetail transaction={transaction}/></>;
}
