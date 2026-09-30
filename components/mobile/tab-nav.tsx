"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

/** mobile (tabs)/_layout: Calculator, Transactions, Certificates, Profile. */
const tabs = [
  { href: "/", label: "Calculator", icon: "calculate" },
  { href: "/transactions", label: "Transactions", icon: "receipt-long" },
  { href: "/certificates", label: "Certificates", icon: "verified" },
  { href: "/profile", label: "Profile", icon: "person" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Bottom tab bar below 800px: 68px, the active tab an amber pill with green label. */
export function BottomTabBar() {
  const pathname = usePathname();
  return <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-border bg-surface px-1 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] min-[800px]:hidden">
    {tabs.map((tab) => {
      const active = isActive(pathname, tab.href);
      return <Link aria-current={active ? "page" : undefined} className={`flex h-[60px] flex-col items-center justify-center gap-[2px] rounded-button ${active ? "bg-accent text-primary" : "text-text-muted"}`} href={tab.href} key={tab.href}>
        <Icon name={tab.icon} size={24}/>
        <span className="text-caption font-semibold">{tab.label}</span>
      </Link>;
    })}
  </nav>;
}

/** The same four destinations, carried in the header from 800px. */
export function HeaderTabs() {
  const pathname = usePathname();
  return <nav aria-label="Main" className="hidden items-center gap-1 min-[800px]:flex">
    {tabs.map((tab) => {
      const active = isActive(pathname, tab.href);
      return <Link aria-current={active ? "page" : undefined} className={`flex items-center gap-2 rounded-button px-3 py-2 text-label font-semibold ${active ? "bg-accent text-primary" : "text-text-muted hover:bg-surface-muted"}`} href={tab.href} key={tab.href}>
        <Icon name={tab.icon} size={20}/>{tab.label}
      </Link>;
    })}
  </nav>;
}
