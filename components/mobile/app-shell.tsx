import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { unreadBadge } from "@/lib/notifications/contracts";
import { loadHeaderIdentity } from "@/lib/practitioner/header";
import { Icon } from "./icon";
import { HeaderTabs } from "./tab-nav";

/** The bell beside the profile photo, with the unread count as a badge. */
function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const badge = unreadBadge(unreadCount);
  return <Link aria-label={badge ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative grid size-[38px] place-items-center rounded-full text-text-muted hover:bg-surface-muted" href="/notifications">
    <Icon name="notifications-none" size={24}/>
    {badge ? <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-caption leading-none font-bold text-text-inverse">{badge}</span> : null}
  </Link>;
}

/** The right of the header once the session is read: bell and photo, or a "Log in" pill. */
async function HeaderIdentity() {
  const { signedIn, avatarUrl, unreadCount } = await loadHeaderIdentity();
  if (!signedIn) return <Link className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-label font-semibold text-text-inverse hover:bg-primary-pressed" href="/login"><Icon name="login" size={18}/>Log in</Link>;
  return <>
    <NotificationBell unreadCount={unreadCount}/>
    <Link aria-label="Profile" className="grid size-[38px] place-items-center overflow-hidden rounded-full bg-surface-muted text-text-muted" href="/profile">
      {avatarUrl ? <Image alt="" className="size-[38px] object-cover" height={38} src={avatarUrl} width={38}/> : <Icon name="person" size={22}/>}
    </Link>
  </>;
}

/** Same footprint as HeaderIdentity, so nothing shifts when it arrives. */
function HeaderIdentityFallback() {
  return <>
    <span aria-hidden="true" className="grid size-[38px] place-items-center text-text-disabled"><Icon name="notifications-none" size={24}/></span>
    <span aria-hidden="true" className="size-[38px] rounded-full bg-surface-muted"/>
  </>;
}

/** The header tabs, for a page that may or may not have a session (the public verification pages). */
async function SessionHeaderTabs() {
  const { signedIn } = await loadHeaderIdentity();
  return signedIn ? <HeaderTabs/> : null;
}

/**
 * mobile AppHeader: the seal on the left and, on the right, the notification bell and the
 * practitioner's photo or, signed out, a "Log in" pill. No title or back arrow, as on mobile;
 * each screen renders its own heading.
 *
 * Only the identity reads wait, behind Suspense, so the header itself appears at once. Inside the
 * practitioner layout the session is already established, so the tabs render without waiting.
 */
export function AppHeader({ practitioner = false }: { practitioner?: boolean }) {
  return <header className="sticky top-0 z-30 border-b border-border bg-background standalone-phone:shrink-0">
    <div className="mx-auto flex max-w-[1040px] items-center gap-4 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-3">
      <Link aria-label="Home" href="/"><Image alt="" className="size-9 object-contain" height={36} priority src="/nba-seal.png" width={36}/></Link>
      <div className="flex flex-1 justify-center">{practitioner ? <HeaderTabs/> : <Suspense fallback={null}><SessionHeaderTabs/></Suspense>}</div>
      <div className="flex items-center gap-4"><Suspense fallback={<HeaderIdentityFallback/>}><HeaderIdentity/></Suspense></div>
    </div>
  </header>;
}

/**
 * Header over content, for pages outside the practitioner layout: the public verification pages,
 * which work signed in or out. The practitioner screens get theirs once, from app/(practitioner)/layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background"><AppHeader/>{children}</div>;
}
