import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { loadHeaderIdentity } from "@/lib/practitioner/header";
import { Icon } from "./icon";
import { BottomTabBar, HeaderTabs } from "./tab-nav";

/**
 * mobile AppHeader: the seal on the left and, on the right, the practitioner's photo or, signed out,
 * a "Log in" pill. No title or back arrow, as on mobile; each screen renders its own heading.
 */
async function AppHeader() {
  const { signedIn, avatarUrl } = await loadHeaderIdentity();
  return <header className="sticky top-0 z-30 border-b border-border bg-background">
    <div className="mx-auto flex max-w-[1040px] items-center gap-4 px-4 pt-2 pb-3">
      <Link aria-label="Home" href={signedIn ? "/" : "/login"}><Image alt="" className="size-9 object-contain" height={36} priority src="/nba-seal.png" width={36}/></Link>
      <div className="flex flex-1 justify-center">{signedIn ? <HeaderTabs/> : null}</div>
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
