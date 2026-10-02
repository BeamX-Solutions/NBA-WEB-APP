"use client";

import Link, { useLinkStatus } from "next/link";
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

/** The four tab screens themselves carry the bottom bar; screens pushed from them do not, as on mobile. */
export function isTabPath(pathname: string): boolean {
  return tabs.some((tab) => tab.href === pathname);
}

/** A faint amber wash over a tapped tab until its screen arrives (Next's useLinkStatus). */
function PendingWash() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={pending ? "pointer-events-none absolute inset-0 animate-pulse rounded-button bg-accent/50" : "hidden"}/>;
}

/**
 * Bottom tab bar below 800px: 68px, the active tab an amber pill with green label. Its background
 * continues below it (after:), so a toolbar animation or bounce never shows content under the bar.
 * In the installed app on a phone it sits in the practitioner frame's normal flow instead of fixed.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  return <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-border bg-surface px-1 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-[100px] after:bg-surface min-[800px]:hidden standalone-phone:static standalone-phone:shrink-0 standalone-phone:after:hidden">
    {tabs.map((tab) => {
      const active = isActive(pathname, tab.href);
      return <Link aria-current={active ? "page" : undefined} className={`relative flex h-[60px] flex-col items-center justify-center gap-[2px] rounded-button ${active ? "bg-accent text-primary" : "text-text-muted"}`} href={tab.href} key={tab.href}>
        <PendingWash/>
        <Icon className="relative" name={tab.icon} size={24}/>
        <span className="relative text-caption font-semibold">{tab.label}</span>
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
      return <Link aria-current={active ? "page" : undefined} className={`relative flex items-center gap-2 rounded-button px-3 py-2 text-label font-semibold ${active ? "bg-accent text-primary" : "text-text-muted hover:bg-surface-muted"}`} href={tab.href} key={tab.href}>
        <PendingWash/>
        <Icon className="relative" name={tab.icon} size={20}/><span className="relative">{tab.label}</span>
      </Link>;
    })}
  </nav>;
}
