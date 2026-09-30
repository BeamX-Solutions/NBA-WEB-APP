import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/**
 * mobile/components/ui/Screen and friends. A screen is the page background with 16px padding;
 * from 800px the content sits in a centred column rather than stretching across the window.
 */
export function Screen({ children, className = "", wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <main className={`mx-auto w-full px-4 pt-4 pb-8 ${wide ? "max-w-[1040px]" : "max-w-[720px]"} ${className}`}>{children}</main>;
}

/** Screen title and supporting line: Playfair 24 bold over a muted 15. */
export function ScreenHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-4">
    <h1 className="m-0 font-heading text-heading leading-tight font-bold text-text">{title}</h1>
    {subtitle ? <p className="mt-1 text-body leading-[21px] text-text-muted">{subtitle}</p> : null}
  </div>;
}

/** Section label inside a card, with a small green icon and an optional underline. */
export function SectionTitle({ children, icon, underline = false }: { children: ReactNode; icon?: IconName; underline?: boolean }) {
  return <div className={`mb-3 flex items-center gap-2 ${underline ? "border-b border-border pb-2" : ""}`}>
    {icon ? <Icon color="var(--color-primary-text)" name={icon} size={20}/> : null}
    <h2 className="m-0 font-heading text-body-lg font-bold text-primary-text">{children}</h2>
  </div>;
}

/** Tappable row with a leading icon and trailing chevron, as in Account Settings. */
export function SettingsRow({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return <Link className="flex items-center gap-3 border-b border-border py-3 last:border-b-0 hover:bg-surface-muted" href={href}>
    <Icon color="var(--color-text-muted)" name={icon} size={20}/>
    <span className="flex-1 text-body text-text">{label}</span>
    <Icon color="var(--color-text-disabled)" name="chevron-right" size={22}/>
  </Link>;
}

/** Label and value pair: 12 uppercase muted label over a 15 value, or 16 semibold when emphasised. */
export function DetailRow({ label, value, emphasise = false }: { label: string; value: ReactNode; emphasise?: boolean }) {
  return <div className="border-b border-border py-3 last:border-b-0">
    <dt className="mb-1 text-caption tracking-[0.5px] text-text-muted uppercase">{label}</dt>
    <dd className={`m-0 wrap-break-word ${emphasise ? "text-body-lg font-semibold" : "text-body"} text-text`}>{value}</dd>
  </div>;
}

/** A <dl> wrapper so DetailRows keep list semantics. */
export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="m-0">{children}</dl>;
}
