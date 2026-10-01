import type { ReactNode } from "react";
import { IconCircle } from "@/components/mobile/states";
import { PRODUCT_NAME } from "@/lib/branding";

export type GateIcon = "hourglass-top" | "error-outline" | "desktop-windows";

/**
 * A full-screen state that replaces the app, following mobile's MembershipPending and AdminWebOnly:
 * an 84px icon circle, a Playfair 20 title, muted body, stretched actions and the product footnote.
 */
export function GateScreen({ children, icon, title }: { children: ReactNode; icon: GateIcon; title: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-8">
    <div className="flex w-full max-w-[440px] flex-col items-center text-center">
      <IconCircle icon={icon} tone={icon === "error-outline" ? "danger" : "success"}/>
      <h1 className="m-0 font-heading text-title font-bold text-text">{title}</h1>
      <div className="w-full">{children}</div>
      <p className="mt-8 text-caption text-text-disabled">{PRODUCT_NAME}</p>
    </div>
  </main>;
}

export function GateBody({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-body leading-[21px] text-text-muted">{children}</p>;
}
