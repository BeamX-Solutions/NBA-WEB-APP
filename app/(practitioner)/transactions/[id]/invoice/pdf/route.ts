import { isUuid } from "@/lib/calculator/contracts";
import { loadPdfAssets } from "@/lib/pdf/assets";
import { createInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { loadInvoice } from "@/lib/transactions/live-transaction";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };

function failure(status: number) {
  return Response.json({ error: "The invoice PDF is unavailable." }, { status, headers });
}

/** Drawn from the stored transaction only; the browser supplies nothing but the id. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return failure(404);
  const { invoice, error } = await loadInvoice(id);
  if (error) return failure(503);
  if (!invoice) return failure(404);
  try {
    const pdf = await createInvoicePdf({
      invoiceNumber: invoice.invoiceNumber, issuedOn: invoice.issuedOn, practitioner: invoice.practitioner, scn: invoice.scn,
      parties: invoice.parties, documentType: invoice.documentType, amountPayable: invoice.amountPayable, branchFee: invoice.branchFee,
      branchName: invoice.branch.name, accountName: invoice.branch.accountName, accountNumber: invoice.branch.accountNumber, bankName: invoice.branch.bankName,
    }, await loadPdfAssets());
    const filename = `invoice-${invoice.invoiceNumber.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`;
    return new Response(pdf, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "X-Content-Type-Options": "nosniff" } });
  } catch {
    return failure(500);
  }
}
