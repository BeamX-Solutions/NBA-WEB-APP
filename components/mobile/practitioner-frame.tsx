"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { InstallBanner } from "@/components/pwa/install-banner";
import { BottomTabBar, isTabPath } from "./tab-nav";

/**
 * The practitioner screens' shell, mounted once by app/(practitioner)/layout and kept between
 * pages: the header, the content, and on the four tab screens the install banner and bottom bar.
 *
 * In the installed app on a phone (standalone-phone) it is a fixed-height frame: the header on top,
 * the content scrolling in between, and the tab bar in normal flow at the bottom, so nothing is
 * position: fixed for iOS to move. Browsers keep the document scrolling, with room left under the
 * fixed bar on tab screens.
 */
export function PractitionerFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const tabScreen = isTabPath(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The frame persists across pages, so its own scroll area is returned to the top on each one,
  // as the document is in a browser.
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [pathname]);

  return <div className="min-h-screen bg-background standalone-phone:flex standalone-phone:min-h-0 standalone-phone:flex-1 standalone-phone:flex-col" data-tab-shell="">
    {header}
    <div className={`${tabScreen ? "pb-[calc(76px+env(safe-area-inset-bottom))] min-[800px]:pb-0" : ""} standalone-phone:min-h-0 standalone-phone:flex-1 standalone-phone:overflow-y-auto standalone-phone:overscroll-contain standalone-phone:pb-0`} ref={scrollRef}>
      {tabScreen ? <InstallBanner/> : null}
      {children}
    </div>
    {tabScreen ? <BottomTabBar/> : null}
  </div>;
}
