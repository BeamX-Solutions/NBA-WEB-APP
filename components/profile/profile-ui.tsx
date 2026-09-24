import type { ReactNode } from "react";
import { TransactionShell } from "@/components/transactions/transaction-shell";

export const profileFocus = "focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2";
export const primaryButton = `flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[#0d5b38] px-5 text-center text-[16px] font-semibold text-white hover:bg-[#064b2e] ${profileFocus}`;
export const inputClass = `min-h-[52px] w-full rounded-[9px] border border-[#cdd3d0] bg-white px-4 text-[16px] text-[#24272a] outline-none focus:border-[#0d5b38] focus:ring-2 focus:ring-[#0d5b38]/15 disabled:bg-[#f7f9f8] disabled:text-[#68727e]`;

export function ProfileIcon({ kind, size = 22 }: { kind: "briefcase" | "medal" | "settings" | "edit" | "bell" | "shield" | "help" | "lock" | "account" | "book" | "support" | "info"; size?: number }) {
  const common = { fill: "none", height: size, viewBox: "0 0 24 24", width: size, stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8, "aria-hidden": true as const };
  if (kind === "briefcase") return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V4h6v3"/></svg>;
  if (kind === "medal") return <svg {...common}><circle cx="12" cy="9" r="7"/><path d="m8 15-1 7 5-3 5 3-1-7m-4-10 1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"/></svg>;
  if (kind === "settings") return <svg {...common}><path d="M10 2h4l.6 2.4 1.6.7 2.1-1.3 2.8 2.8-1.3 2.1.7 1.6L23 11v4l-2.5.6-.7 1.6 1.3 2.1-2.8 2.8-2.1-1.3-1.6.7L14 24h-4l-.6-2.5-1.6-.7-2.1 1.3-2.8-2.8 1.3-2.1-.7-1.6L1 15v-4l2.5-.7.7-1.6-1.3-2.1 2.8-2.8 2.1 1.3 1.6-.7z" transform="translate(1 -1) scale(.92)"/><circle cx="12" cy="12" r="3"/></svg>;
  if (kind === "edit") return <svg {...common}><path d="m4 17 12-12 3 3L7 20l-4 1zM14 7l3 3"/></svg>;
  if (kind === "bell") return <svg {...common}><path d="M5 18h14l-2-3V9a5 5 0 0 0-10 0v6zm5 3h4"/></svg>;
  if (kind === "shield") return <svg {...common}><path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M12 2v20"/></svg>;
  if (kind === "help") return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 5 2c-1.5 1-2 1.5-2 3m0 3h.01"/></svg>;
  if (kind === "lock") return <svg {...common}><rect x="5" y="10" width="14" height="12" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v3"/></svg>;
  if (kind === "account") return <svg {...common}><rect x="2" y="5" width="20" height="16" rx="1"/><path d="M8 5V2h8v3m-9 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm6 0h6m-6 4h6M5 19h6"/></svg>;
  if (kind === "book") return <svg {...common}><path d="M5 3h15v17H5a2 2 0 1 1 0-4h15M5 3a2 2 0 0 0-2 2v13"/><path d="M10 8a2 2 0 0 1 4 0c0 1-2 1.5-2 3m0 2h.01"/></svg>;
  if (kind === "support") return <svg {...common}><path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13h3v6H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm18 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Zm-3 6c0 2-3 3-6 3"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 10v7m0-10h.01"/></svg>;
}

export function ProfileFrame({ children, navigation = false }: { children: ReactNode; navigation?: boolean }) {
  return <TransactionShell activeNavigation="profile" showNavigation={navigation}><main className={`mx-auto max-w-[1080px] px-4 pt-6 min-[800px]:px-7 min-[800px]:pt-10 ${navigation ? "pb-[calc(110px+env(safe-area-inset-bottom))]" : "pb-12"}`}>{children}</main></TransactionShell>;
}

export function ProfileHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-6"><h1 className="font-serif text-[30px] leading-[1.15] font-bold min-[800px]:text-[40px]">{title}</h1><p className="mt-2 text-[16px] leading-[1.5] text-[#66717e]">{description}</p></div>;
}

export function ProfileCard({ title, icon, children, className = "" }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-[#e0e2e2] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.02)] min-[800px]:p-6 ${className}`}>{title ? <h2 className="mb-4 flex items-center gap-3 border-b border-[#e0e2e2] pb-3 font-serif text-[20px] leading-[1.3] font-bold text-[#155c3a] min-[800px]:text-[24px]"><span aria-hidden="true" className="font-sans text-[21px]">{icon}</span>{title}</h2> : null}{children}</section>;
}

export function PersonGlyph({ large = false }: { large?: boolean }) {
  return <span aria-hidden="true" className={`grid place-items-center rounded-[20%] border-2 border-[#0d5b38] bg-[#fbfdfc] text-[#66717e] ${large ? "size-[92px]" : "size-[72px]"}`}><svg fill="currentColor" height={large ? 40 : 33} viewBox="0 0 24 24" width={large ? 40 : 33}><circle cx="12" cy="7" r="4"/><path d="M3.5 21c.3-4.4 3.4-7 8.5-7s8.2 2.6 8.5 7H3.5Z"/></svg></span>;
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-[#eceeee] py-4 first:pt-1 last:border-b-0 last:pb-1"><dt className="text-[12px] uppercase tracking-[.06em] text-[#66717e]">{label}</dt><dd className="mt-1 break-words text-[16px] leading-[1.4]">{value}</dd></div>;
}

export function PreviewNote({ children }: { children: ReactNode }) {
  return <p className="text-center text-[12px] leading-[1.5] text-[#69737d]">{children}</p>;
}
