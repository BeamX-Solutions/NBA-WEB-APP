"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loadTransactionsAction } from "@/app/(practitioner)/transactions/actions";
import { StatusBadge } from "@/components/mobile/badge";
import { Button, ButtonLink } from "@/components/mobile/button";
import { SelectField } from "@/components/mobile/field";
import { Icon } from "@/components/mobile/icon";
import { Screen, ScreenHeading } from "@/components/mobile/screen";
import { EmptyState, ErrorState, LoadingState, Notice } from "@/components/mobile/states";
import type { TransactionRecord } from "@/lib/transactions/contracts";
import type { TransactionPage } from "@/lib/transactions/live-transaction";
import { statusLabels, type TransactionStatus } from "@/lib/transactions/sample-transactions";

const SEARCH_DELAY_MS = 300;
const statusOptions = [{ value: "all", label: "All Statuses" }, ...(Object.keys(statusLabels) as TransactionStatus[]).map((value) => ({ value, label: statusLabels[value] }))];
const moreError = "More transactions could not be loaded. Check your connection and try again.";

type ListPage = { key: string; items: TransactionRecord[]; cursor: string | null };

/** Identifies a search, or "" for the unfiltered list. */
function filterKey(search: string, status: string): string {
  const term = search.trim();
  return term || status !== "all" ? `${status}|${term}` : "";
}

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

/**
 * mobile (tabs)/transactions. Cards become a two-column grid from 800px. The server sends the first
 * page; search, the status filter and Load more fetch further pages from the database, so they
 * cover the whole history rather than what has been downloaded.
 */
export function TransactionsList({ initial }: { initial: TransactionPage }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  // The unfiltered list, and the results for one search, kept apart so clearing a search shows
  // the unfiltered list again without fetching it.
  const [base, setBase] = useState<ListPage>({ key: "", items: initial.transactions, cursor: initial.nextCursor });
  const [results, setResults] = useState<ListPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState("");
  // Only the newest request may update the list, so a slow early response cannot overwrite a later one.
  const latest = useRef(0);
  const key = filterKey(search, status);
  const filtered = key !== "";
  const shown = filtered ? (results?.key === key ? results : null) : base;
  const searching = filtered && shown === null;

  useEffect(() => {
    const request = ++latest.current;
    if (!filtered) return;
    const timer = window.setTimeout(async () => {
      try {
        const page = await loadTransactionsAction({ q: search, status });
        if (request !== latest.current) return;
        setResults({ key, items: page.transactions, cursor: page.nextCursor });
        setMessage(page.error ?? "");
      } catch {
        if (request !== latest.current) return;
        setResults({ key, items: [], cursor: null });
        setMessage(moreError);
      }
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [filtered, key, search, status]);

  async function loadMore() {
    if (!shown?.cursor) return;
    const request = latest.current;
    const page = shown;
    setLoadingMore(true);
    setMessage("");
    try {
      const next = await loadTransactionsAction({ q: search, status, cursor: page.cursor });
      if (request !== latest.current) return;
      if (next.error) { setMessage(next.error); return; }
      const merged = { key: page.key, items: [...page.items, ...next.transactions], cursor: next.nextCursor };
      if (page.key) setResults(merged); else setBase(merged);
    } catch {
      if (request === latest.current) setMessage(moreError);
    } finally {
      setLoadingMore(false);
    }
  }

  if (initial.error) return <Screen wide>{heading}<ErrorState action={<Button onClick={() => router.refresh()} variant="outline">Try again</Button>} body={initial.error}/></Screen>;

  if (!initial.transactions.length) {
    return <Screen wide>{heading}<EmptyState action={<ButtonLink href="/">Calculate a fee</ButtonLink>} body="When you calculate a fee and generate an invoice, it appears here so you can upload your client's payment slip and follow it to the certificate." icon="receipt-long" title="No transactions yet"/></Screen>;
  }

  return <Screen wide>
    {heading}
    <div className="min-[800px]:grid min-[800px]:grid-cols-2 min-[800px]:gap-3">
      <label className="mb-3 flex items-center gap-2 rounded-input border border-border-strong bg-surface px-3 focus-within:outline-3 focus-within:outline-primary/35">
        <Icon color="var(--color-text-muted)" name="search" size={20}/>
        <span className="sr-only">Search by Document Type or ID</span>
        <input className="min-w-0 flex-1 border-0 bg-transparent py-3 text-body text-text outline-none placeholder:text-text-disabled" maxLength={80} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Document Type or ID" type="search" value={search}/>
      </label>
      <SelectField hideLabel id="transaction-status" label="Filter by status" onChange={setStatus} options={statusOptions} placeholder="All Statuses" value={status}/>
    </div>
    {message ? <Notice className="mb-3" tone="error">{message}</Notice> : null}
    {searching || !shown ? <LoadingState label="Searching your transactions"/>
      : shown.items.length ? <>
        <div aria-live="polite" className="grid gap-3 min-[800px]:grid-cols-2">{shown.items.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction}/>)}</div>
        {shown.cursor ? <div className="mt-3"><Button loading={loadingMore} onClick={loadMore} variant="outline">Load More Transactions</Button></div> : null}
      </>
      : <div className="rounded-card border border-border bg-surface p-4"><p className="py-4 text-center text-body leading-[22px] text-text-muted">No transactions match your search.</p></div>}
  </Screen>;
}
