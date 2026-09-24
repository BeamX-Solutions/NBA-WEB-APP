"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, SearchIcon } from "@/components/ui/icons";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { sampleTransactions, statusLabels, type SampleTransaction, type TransactionStatus } from "@/lib/transactions/sample-transactions";

type StatusFilter = TransactionStatus | "all";
const filters: readonly StatusFilter[] = ["all", "awaiting", "pending", "verified", "rejected"];
const filterLabel = (status: StatusFilter): string => status === "all" ? "All Statuses" : statusLabels[status];
const focusClass = "focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2";

function StatusSheet({ selected, onSelect, onClose }: { selected: StatusFilter; onSelect: (value: StatusFilter) => void; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); }
      if (event.key !== "Tab" || !panelRef.current) return;
      const buttons = Array.from(panelRef.current.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  return <div className="fixed inset-0 z-50 flex items-end justify-center min-[800px]:items-center">
    <button aria-label="Close status filter" className="absolute inset-0 h-full w-full border-0 bg-[rgba(25,34,31,.46)]" onClick={onClose} tabIndex={-1} type="button"/>
    <div aria-labelledby="status-sheet-title" aria-modal="true" className="relative w-full max-w-[540px] rounded-t-[22px] bg-white px-4 pt-2 pb-[max(28px,env(safe-area-inset-bottom))] shadow-xl min-[800px]:rounded-[18px]" ref={panelRef} role="dialog">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e0e3e3]"/>
      <div className="flex h-10 items-center justify-between"><h2 className="sr-only" id="status-sheet-title">Filter by status</h2><span/><button aria-label="Close status filter" className={`grid size-10 place-items-center border-0 bg-transparent text-[28px] font-light text-[#66717e] ${focusClass}`} onClick={onClose} ref={closeRef} type="button">×</button></div>
      <div className="mt-5">{filters.map((status) => <button aria-pressed={selected === status} className={`flex min-h-[55px] w-full items-center justify-between border-0 border-b border-[#e4e6e6] bg-white py-3 text-left text-[16px] last:border-b-0 ${focusClass} ${selected === status ? "font-bold text-nba-primary" : "text-[#24272a]"}`} key={status} onClick={() => onSelect(status)} type="button"><span>{filterLabel(status)}</span>{selected === status ? <CheckIcon size={21}/> : null}</button>)}</div>
    </div>
  </div>;
}

function TransactionCard({ transaction }: { transaction: SampleTransaction }) {
  return <Link aria-label={`View sample ${transaction.documentType}, ${statusLabels[transaction.status]}, ${transaction.id}`} className={`block rounded-[13px] border border-[#e0e2e2] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,.02)] transition-colors hover:border-[#93aaa0] ${focusClass}`} href={`/transactions/${transaction.id}`}>
    <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-[16px] leading-[1.35] font-bold">{transaction.documentType}</h2><span className={`rounded-full px-3 py-[7px] text-[12px] font-semibold whitespace-nowrap ${transaction.status === "verified" ? "bg-[#e8f8ef] text-[#167345]" : transaction.status === "awaiting" ? "bg-[#fff6da] text-[#86601a]" : transaction.status === "rejected" ? "bg-[#fcece9] text-[#9b392d]" : "bg-[#f0f3f2] text-[#66717e]"}`}>{statusLabels[transaction.status]}</span></div>
    <p className="mt-[5px] text-[13px] text-[#697381]">{transaction.id} - {transaction.date}</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[13px] text-[#697381]">Professional Fee</p><strong className="mt-1 block text-[20px] leading-[1.2] text-nba-primary">{transaction.professionalFee}</strong></div><p className="text-[12px] text-[#697381]">Consideration: {transaction.consideration}</p></div>
  </Link>;
}

export function TransactionsList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const matches = sampleTransactions.filter((transaction) => {
    const search = query.trim().toLowerCase();
    return (status === "all" || transaction.status === status) && (!search || transaction.documentType.toLowerCase().includes(search) || transaction.id.toLowerCase().includes(search));
  });

  return <TransactionShell showNavigation><main className="mx-auto max-w-[1080px] px-4 pt-[21px] pb-[calc(100px+env(safe-area-inset-bottom))] min-[800px]:px-7 min-[800px]:pt-9">
    <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="font-serif text-[28px] leading-[1.2] font-bold min-[800px]:text-[38px]">Transactions</h1><span className="rounded-full bg-[#edf3f0] px-2 py-1 text-[11px] font-semibold text-nba-primary">Sample data</span></div>
    <p className="mt-2 text-[16px] leading-[1.45] text-[#66717e]">Review your recent fee calculations and invoice statuses.</p>
    <div className="mt-5 flex h-[46px] items-center gap-3 rounded-[9px] border border-[#cdd3d1] bg-white px-[14px] text-[#66717e] focus-within:border-[#8c969b] focus-within:ring-2 focus-within:ring-[#dce1e0]"><SearchIcon size={20}/><label className="sr-only" htmlFor="transaction-search">Search by Document Type or ID</label><input className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#24272a] outline-none placeholder:text-[#8b93a0]" id="transaction-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search by Document Type or ID" type="search" value={query}/></div>
    <button aria-expanded={sheetOpen} aria-haspopup="dialog" className={`mt-10 flex h-[50px] w-full items-center justify-between rounded-[9px] border border-[#cdd3d1] bg-white px-[13px] text-left text-[16px] ${focusClass}`} onClick={() => setSheetOpen(true)} type="button"><span>{filterLabel(status)}</span><svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="m5 9 7 7 7-7" stroke="#66717e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg></button>
    <div aria-live="polite" className="mt-4 grid gap-3 min-[800px]:grid-cols-2">{matches.length ? matches.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction}/>) : <div className="rounded-[13px] border border-[#e0e2e2] bg-white p-6 text-center text-[#66717e] min-[800px]:col-span-2"><h2 className="mb-2 font-serif text-[22px] text-[#24272a]">No transactions found</h2><p>Try another document type, ID, or status.</p></div>}</div>
  </main>{sheetOpen ? <StatusSheet onClose={() => setSheetOpen(false)} onSelect={(value) => { setStatus(value); setSheetOpen(false); }} selected={status}/> : null}</TransactionShell>;
}
