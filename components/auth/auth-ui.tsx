import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FormNotice, type NoticeTone } from "@/components/ui/form-notice";

export function AuthSeal({ large = false }: { large?: boolean }) {
  return <Image alt="Nigerian Bar Association seal" className={large ? "auth-seal auth-seal--large" : "auth-seal"} height={large ? 96 : 72} priority src="/nba-seal.png" width={large ? 96 : 72} />;
}

export function AuthField({
  children,
  error,
  hint,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  id: string;
  label: string;
}) {
  return <div className="auth-field"><label className="auth-label" htmlFor={id}>{label}</label>{children}{error ? <p className="auth-error" id={`${id}-error`} role="alert">{error}</p> : hint ? <p className="auth-hint">{hint}</p> : null}</div>;
}

export function AuthStatus({ children, tone = "info" }: { children: ReactNode; tone?: NoticeTone }) {
  return <FormNotice className="auth-status" tone={tone}>{children}</FormNotice>;
}

export function AuthSwitchLink({ href, prefix, text }: { href: string; prefix: string; text: string }) {
  return <p className="auth-switch">{prefix} <Link href={href}>{text}</Link></p>;
}
