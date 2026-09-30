"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/mobile/badge";
import { Button, ButtonLink } from "@/components/mobile/button";
import { SelectField } from "@/components/mobile/field";
import { Icon } from "@/components/mobile/icon";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { EmptyState, ErrorState } from "@/components/mobile/states";
import type { TransactionRecord } from "@/lib/transactions/contracts";
import { statusLabels, type TransactionStatus } from "@/lib/transactions/sample-transactions";

const PAGE_SIZE = 10;
const statusOptions = [{ value: "all", label: "All Statuses" }, ...(Object.keys(statusLabels) as TransactionStatus[]).map((value) => ({ value, label: statusLabels[value] }))];

function TransactionCard({ transaction }: { transaction: TransactionRecord }) {
  return <Link className="block rounded-card border border-border bg-surface p-4 hover:border-border-strong" href={`/transactions/${transaction.id}`}>
    <div className="flex items-start justify-between gap-2"><h2 className="m-0 flex-1 text-body-lg font-bold text-text">{transaction.documentType}</h2><StatusBadge status={transaction.status}/></div>
    <p className="mt-1 text-caption text-text-muted">{transaction.invoiceNumber} - {transaction.date}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <div><p className="text-caption text-text-muted">Professional Fee</p><p className="text-title font-bold text-primary">{transaction.amountPayable}</p></div>
      <p className="flex-1 text-right text-caption text-text-muted">Consideration: {transaction.consideration}</p>
    </div>
  </Link>;
}

const heading = <ScreenHeading subtitle="Review your recent fee calculations and invoice statuses." title="Transactions"/>;

/** mobile (tabs)/transactions. Cards become a two-column grid from 800px. */
export function TransactionsList({ transactions, error }: { transactions: TransactionRecord[]; error: string | null }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions.filter((transaction) => (status === "all" || transaction.status === status) && (!term || transaction.documentType.toLowerCase().includes(term) || transaction.parties.toLowerCase().includes(term) || transaction.invoiceNumber.toLowerCase().includes(term)));
  }, [search, status, transactions]);

  if (error) return <Screen wide>{heading}<ErrorState action={<Button onClick={() => router.refresh()} variant="outline">Try again</Button>} body={error}/></Screen>;

  if (!transactions.length) {
    return <Screen wide>{heading}<EmptyState action={<ButtonLink href="/">Calculate a fee</ButtonLink>} body="When you calculate a fee and generate an invoice, it appears here so you can upload your client's payment slip and follow it to the certificate." icon="receipt-long" title="No transactions yet"/></Screen>;
  }

  return <Screen wide>
    {heading}
    <div className="min-[800px]:grid min-[800px]:grid-cols-2 min-[800px]:gap-3">
      <label className="mb-3 flex items-center gap-2 rounded-input border border-border-strong bg-surface px-3 focus-within:outline-3 focus-within:outline-primary/35">
        <Icon color="var(--color-text-muted)" name="search" size={20}/>
        <span className="sr-only">Search by Document Type or ID</span>
        <input className="min-w-0 flex-1 border-0 bg-transparent py-3 text-body text-text outline-none placeholder:text-text-disabled" onChange={(event) => { setSearch(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search by Document Type or ID" type="search" value={search}/>
      </label>
      <SelectField hideLabel id="transaction-status" label="Filter by status" onChange={(value) => { setStatus(value); setVisibleCount(PAGE_SIZE); }} options={statusOptions} placeholder="All Statuses" value={status}/>
    </div>
    {matches.length ? <>
      <div aria-live="polite" className="grid gap-3 min-[800px]:grid-cols-2">{matches.slice(0, visibleCount).map((transaction) => <TransactionCard key={transaction.id} transaction={transaction}/>)}</div>
      {matches.length > visibleCount ? <div className="mt-3"><Button onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} variant="outline">Load More Transactions</Button></div> : null}
    </> : <div className="rounded-card border border-border bg-surface p-4"><p className="py-4 text-center text-body leading-[22px] text-text-muted">No transactions match your search.</p></div>}
  </Screen>;
}
