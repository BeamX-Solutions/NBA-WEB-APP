import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { unreadBadge } from "@/lib/notifications/contracts";
import { loadHeaderIdentity } from "@/lib/practitioner/header";
import { Icon } from "./icon";
import { BottomTabBar, HeaderTabs } from "./tab-nav";

/** The bell beside the profile photo, with the unread count as a badge. */
function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const badge = unreadBadge(unreadCount);
  return <Link aria-label={badge ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative grid size-[38px] place-items-center rounded-full text-text-muted hover:bg-surface-muted" href="/notifications">
    <Icon name="notifications-none" size={24}/>
    {badge ? <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-caption leading-none font-bold text-text-inverse">{badge}</span> : null}
  </Link>;
}

/**
 * mobile AppHeader: the seal on the left and, on the right, the notification bell and the
 * practitioner's photo or, signed out, a "Log in" pill. No title or back arrow, as on mobile;
 * each screen renders its own heading.
 */
async function AppHeader() {
  const { signedIn, avatarUrl, unreadCount } = await loadHeaderIdentity();
  return <header className="sticky top-0 z-30 border-b border-border bg-background">
    <div className="mx-auto flex max-w-[1040px] items-center gap-4 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-3">
      <Link aria-label="Home" href={signedIn ? "/" : "/login"}><Image alt="" className="size-9 object-contain" height={36} priority src="/nba-seal.png" width={36}/></Link>
      <div className="flex flex-1 justify-center">{signedIn ? <HeaderTabs/> : null}</div>
      {signedIn ? <NotificationBell unreadCount={unreadCount}/> : null}
      {signedIn ? <Link aria-label="Profile" className="grid size-[38px] place-items-center overflow-hidden rounded-full bg-surface-muted text-text-muted" href="/profile">
        {avatarUrl ? <Image alt="" className="size-[38px] object-cover" height={38} src={avatarUrl} width={38}/> : <Icon name="person" size={22}/>}
      </Link> : <Link className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-label font-semibold text-text-inverse hover:bg-primary-pressed" href="/login"><Icon name="login" size={18}/>Log in</Link>}
    </div>
  </header>;
}

/**
 * Header, content and (on the four tab screens) the bottom tab bar. Pushed screens such as a
 * transaction's detail carry the header only, as on mobile.
 */
export async function AppShell({ children, tabs = false }: { children: ReactNode; tabs?: boolean }) {
  const { signedIn } = await loadHeaderIdentity();
  return <div className="min-h-screen bg-background">
    <AppHeader/>
    <div className={tabs && signedIn ? "pb-[calc(76px+env(safe-area-inset-bottom))] min-[800px]:pb-0" : ""}>{children}</div>
    {tabs && signedIn ? <BottomTabBar/> : null}
  </div>;
}
