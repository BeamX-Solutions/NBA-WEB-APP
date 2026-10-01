import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** The auth screens carry no header, as on mobile: a centred column on the page background. */
export function AuthScreen({ children, centred = true }: { children: ReactNode; centred?: boolean }) {
  return <main className={`mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 py-8 ${centred ? "justify-center" : ""}`}>{children}</main>;
}

export function Seal({ size }: { size: number }) {
  return <Image alt="Nigerian Bar Association seal" className="object-contain" height={size} priority src="/nba-seal.png" style={{ width: size, height: size }} width={size}/>;
}

/** "Don't have an account? Register here" and friends: 14 muted, link 14 bold green. */
export function AuthFooterLink({ href, prefix, text }: { href: string; prefix: string; text: string }) {
  return <p className="m-0 text-center text-label text-text-muted">{prefix} <Link className="font-bold text-primary" href={href}>{text}</Link></p>;
}

/** Inline submit feedback: 14 danger for errors, 14 green for confirmations, as on mobile. */
export function FormMessage({ children, tone }: { children: ReactNode; tone: "error" | "success" | "info" }) {
  const color = tone === "error" ? "text-danger" : tone === "success" ? "text-primary" : "text-text-muted";
  return <p aria-live={tone === "error" ? "assertive" : "polite"} className={`mb-3 text-label leading-[20px] ${color}`} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}
