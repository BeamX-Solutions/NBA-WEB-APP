import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthSeal({ large = false }: { large?: boolean }) {
  return <Image alt="Nigerian Bar Association seal" className={large ? "auth-seal auth-seal--large" : "auth-seal"} height={large ? 96 : 72} priority src="/nba-seal.png" width={large ? 96 : 72} />;
}

export function AuthField({
  children,
  hint,
  id,
  label,
}: {
  children: ReactNode;
  hint?: string;
  id: string;
  label: string;
}) {
  return <div className="auth-field"><label className="auth-label" htmlFor={id}>{label}</label>{children}{hint ? <p className="auth-hint">{hint}</p> : null}</div>;
}

export function AuthStatus({ children }: { children: ReactNode }) {
  return <p className="auth-status" role="status" aria-live="polite">{children}</p>;
}

export function AuthSwitchLink({ href, prefix, text }: { href: string; prefix: string; text: string }) {
  return <p className="auth-switch">{prefix} <Link href={href}>{text}</Link></p>;
}
