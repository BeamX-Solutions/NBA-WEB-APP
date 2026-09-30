import { notFound } from "next/navigation";
import { AppShell } from "@/components/mobile/app-shell";
import { ButtonLink } from "@/components/mobile/button";
import { Screen } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";
import { InvoiceView } from "@/components/transactions/invoice-view";
import { isUuid } from "@/lib/calculator/contracts";
import { loadInvoice } from "@/lib/transactions/live-transaction";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { invoice, error } = await loadInvoice(id);
  if (error) return <AppShell><Screen><ErrorState action={<ButtonLink href="/transactions" variant="outline">Back to Transactions</ButtonLink>} body={error} title="This invoice could not be loaded"/></Screen></AppShell>;
  if (!invoice) notFound();
  return <AppShell><InvoiceView invoice={invoice}/></AppShell>;
}
