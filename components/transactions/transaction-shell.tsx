"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const focusClass = "focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2";

function PersonIcon() {
  return <svg aria-hidden="true" fill="currentColor" height="22" viewBox="0 0 24 24" width="22"><circle cx="12" cy="7.5" r="4"/><path d="M3.5 21c.3-4.3 3.5-7 8.5-7s8.2 2.7 8.5 7H3.5Z"/></svg>;
}

function NavIcon({ kind }: { kind: "calculator" | "transactions" | "certificates" | "profile" }) {
  if (kind === "profile") return <PersonIcon/>;
  if (kind === "calculator") return <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><rect x="3" y="2" width="18" height="20" rx="2" fill="currentColor"/><path d="M7 7h6m-3-3v6m6-2 3-3m-3 0 3 3M7 16h6m-3-3v6m6-2h3" stroke="#fff" strokeLinecap="round" strokeWidth="1.5"/></svg>;
  if (kind === "transactions") return <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><path d="M5 2.5 7 4l2-1.5L11 4l2-1.5L15 4l2-1.5L19 4v17l-2-1.5L15 21l-2-1.5L11 21l-2-1.5L7 21l-2-1.5v-17Z" fill="currentColor"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" strokeLinecap="round" strokeWidth="1.5"/></svg>;
  return <svg aria-hidden="true" fill="currentColor" height="22" viewBox="0 0 24 24" width="22"><path d="m12 1.5 2.7 2 3.3-.3 1.2 3 3 1.2-.3 3.3 2 2.8-2 2.7.3 3.3-3 1.2-1.2 3-3.3-.3-2.7 2-2.7-2-3.3.3-1.2-3-3-1.2.3-3.3-2-2.7 2-2.8-.3-3.3 3-1.2 1.2-3 3.3.3L12 1.5Z"/><path d="m7.5 12.2 3 3 6-6" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

export function TransactionShell({ children, showNavigation = false, activeNavigation = "transactions" }: { children: React.ReactNode; showNavigation?: boolean; activeNavigation?: "transactions" | "certificates" }) {
  const [message, setMessage] = useState("");
  const itemClass = `flex min-w-0 flex-col items-center justify-center gap-1 rounded-[8px] text-[11px] font-semibold ${focusClass}`;

  return <div className="min-h-screen bg-[#fcfcfd] font-[Arial,Helvetica,sans-serif] text-[#24272a]">
    <header className="flex h-[68px] items-center justify-between border-b border-[#e9e9e9] bg-white px-4 min-[800px]:h-[80px] min-[800px]:px-[max(32px,calc((100vw-1080px)/2))]">
      <Link aria-label="NBA Legal Fees home" className={focusClass} href="/"><Image alt="NBA Anaocha Branch" className="size-[35px] object-contain" height={35} src="/nba-seal.png" width={35}/></Link>
      <button aria-label="Profile unavailable" className={`grid size-10 place-items-center rounded-full border-0 bg-[#f8f9f9] text-[#66717e] ${focusClass}`} onClick={() => setMessage("Profile is not available yet.")} type="button"><PersonIcon/></button>
    </header>
    {children}
    {showNavigation ? <nav aria-label="Practitioner navigation" className="fixed right-0 bottom-0 left-0 z-20 grid h-[calc(70px+env(safe-area-inset-bottom))] grid-cols-4 gap-1 border-t border-[#eef0ef] bg-white p-[6px] pb-[calc(6px+env(safe-area-inset-bottom))] min-[800px]:mx-auto min-[800px]:h-[72px] min-[800px]:w-[430px] min-[800px]:rounded-t-nba-large min-[800px]:border min-[800px]:border-[#e1e5e3] min-[800px]:shadow-[0_-3px_20px_rgba(0,0,0,.05)]">
      <Link className={`${itemClass} text-[#65707e]`} href="/"><NavIcon kind="calculator"/><span>Calculator</span></Link>
      <Link aria-current={activeNavigation === "transactions" ? "page" : undefined} className={`${itemClass} ${activeNavigation === "transactions" ? "bg-[#fac542] text-nba-primary" : "text-[#65707e]"}`} href="/transactions"><NavIcon kind="transactions"/><span>Transactions</span></Link>
      <Link aria-current={activeNavigation === "certificates" ? "page" : undefined} className={`${itemClass} ${activeNavigation === "certificates" ? "bg-[#fac542] text-nba-primary" : "text-[#65707e]"}`} href="/certificates"><NavIcon kind="certificates"/><span>Certificates</span></Link>
      <button className={`${itemClass} border-0 bg-transparent text-[#65707e]`} onClick={() => setMessage("Profile is not available yet.")} type="button"><NavIcon kind="profile"/><span>Profile</span></button>
    </nav> : null}
    {message ? <div aria-live="polite" className="fixed right-4 bottom-[85px] left-4 z-30 mx-auto max-w-[400px] rounded-nba-medium bg-[#17392b] px-4 py-3 text-center text-[13px] text-white" role="status">{message}</div> : null}
  </div>;
}
