import Link from "next/link";
import { Badge } from "@/components/mobile/badge";
import { Card } from "@/components/mobile/card";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { EmptyState, ErrorState } from "@/components/mobile/states";
import { formatNaira } from "@/lib/fees/legal-fees";
import type { PaymentRecord, Status, Tone } from "@/lib/payments/contracts";
import type { PaymentsLoad } from "@/lib/payments/live-payments";

const toneClass: Record<Tone, string> = {
  success: "bg-success-surface text-success",
  warning: "bg-accent-surface text-accent-text",
  neutral: "bg-neutral-surface text-text-muted",
  danger: "bg-danger-surface text-danger",
};

const heading = <ScreenHeading subtitle="What your clients have paid your branch, and what your branch has paid you." title="Payments"/>;

function StatusPill({ status }: { status: Status | null }) {
  return status ? <Badge className={toneClass[status.tone]} label={status.label}/> : <span className="text-body text-text-muted">—</span>;
}

/** A route handler, not a page: it checks the invoice is theirs and redirects to a short lived signed link. */
function Actions({ payment }: { payment: PaymentRecord }) {
  return <span className="flex items-center justify-end gap-4">
    {payment.hasReceipt ? <a className="text-label font-semibold text-primary hover:underline" href={`/payments/receipt/${payment.id}`} rel="noopener" target="_blank">View receipt</a> : null}
    <Link className={`text-label hover:underline ${payment.hasReceipt ? "text-text-muted" : "font-semibold text-primary"}`} href={`/transactions/${payment.id}`}>View invoice</Link>
  </span>;
}

function sum(payments: PaymentRecord[], label: string): { total: string; count: number } {
  const matching = payments.filter((p) => p.payout?.label === label);
  return { total: formatNaira(matching.reduce((t, p) => t + p.shareKobo, 0n)), count: matching.length };
}

function Summary({ label, value, count, className }: { label: string; value: string; count: number; className: string }) {
  return <Card className="flex-1">
    <p className="text-caption text-text-muted">{label}</p>
    <p className={`mt-1 text-title font-bold ${className}`}>{value}</p>
    <p className="mt-1 text-caption text-text-muted">{count} {count === 1 ? "invoice" : "invoices"}</p>
  </Card>;
}

/** Phone width: one card per invoice, carrying the five columns in the same order. */
function PaymentCard({ payment }: { payment: PaymentRecord }) {
  return <Card>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1"><h2 className="m-0 text-body-lg font-bold text-text">{payment.documentType}</h2><p className="mt-1 text-caption text-text-muted">{payment.invoiceNumber}</p></div>
      <div className="text-right"><p className="text-caption text-text-muted">Amount</p><p className="text-title font-bold text-primary">{payment.amount}</p></div>
    </div>
    <dl className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3">
      <div className="grid gap-1"><dt className="text-caption text-text-muted">Date</dt><dd className="m-0 text-body text-text">{payment.date}</dd></div>
      <div className="grid gap-1"><dt className="text-caption text-text-muted">Pay-in</dt><dd className="m-0"><StatusPill status={payment.payIn}/></dd></div>
      <div className="grid gap-1"><dt className="text-caption text-text-muted">Payout</dt><dd className="m-0"><StatusPill status={payment.payout}/></dd></div>
    </dl>
    <div className="mt-3"><Actions payment={payment}/></div>
  </Card>;
}

/**
 * Payments: for each invoice, whether the client has paid the branch (pay-in) and whether the
 * branch has paid the practitioner their share (payout). The columns are the client's: Amount,
 * Date, Pay-in Status, Payout Status, Action. A table from 800px; cards below, as on mobile.
 */
export function PaymentsList({ load }: { load: PaymentsLoad }) {
  if (load.error) return <Screen wide>{heading}<ErrorState body={load.error}/></Screen>;
  const { payments } = load;
  if (payments.length === 0) return <Screen wide>{heading}<EmptyState body="When you generate an invoice and your client pays your branch, it appears here, and so does your branch paying you your share." icon="payments" title="No payments yet"/></Screen>;
  const pending = sum(payments, "Pending");
  const paid = sum(payments, "Confirmed");
  return <Screen wide>
    {heading}
    <div className="mb-4 flex gap-3">
      <Summary className="text-accent-text" count={pending.count} label="Pending from your branch" value={pending.total}/>
      <Summary className="text-success" count={paid.count} label="Paid to you" value={paid.total}/>
    </div>
    <div className="grid gap-3 min-[800px]:hidden">{payments.map((payment) => <PaymentCard key={payment.id} payment={payment}/>)}</div>
    <Card className="hidden overflow-x-auto p-0 min-[800px]:block">
      <table className="w-full text-left text-body">
        <thead className="border-b border-border bg-surface-muted text-caption text-text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Invoice</th>
            <th className="px-4 py-3 text-right font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Pay-in Status</th>
            <th className="px-4 py-3 font-semibold">Payout Status</th>
            <th className="px-4 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => <tr className="border-b border-border last:border-0" key={payment.id}>
            <td className="px-4 py-3"><p className="font-semibold text-text">{payment.documentType}</p><p className="text-caption text-text-muted">{payment.invoiceNumber}</p></td>
            <td className="px-4 py-3 text-right font-bold text-primary">{payment.amount}</td>
            <td className="px-4 py-3 text-text">{payment.date}</td>
            <td className="px-4 py-3"><StatusPill status={payment.payIn}/></td>
            <td className="px-4 py-3"><StatusPill status={payment.payout}/></td>
            <td className="px-4 py-3"><Actions payment={payment}/></td>
          </tr>)}
        </tbody>
      </table>
    </Card>
  </Screen>;
}
