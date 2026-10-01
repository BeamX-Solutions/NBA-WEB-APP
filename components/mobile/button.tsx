import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "danger";

/** mobile/components/ui/Button: solid green, green outline, or red outline. Min height 48, radius 10. */
export function buttonClass(variant: ButtonVariant = "primary", className = ""): string {
  const base = "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-button px-4 py-[14px] text-center text-body-lg leading-tight font-semibold transition-colors disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-text-inverse hover:bg-primary-pressed active:bg-primary-pressed",
    outline: "border-[1.5px] border-primary bg-surface text-primary hover:bg-success-surface active:bg-success-surface",
    danger: "border-[1.5px] border-danger bg-surface text-danger hover:bg-danger-surface active:bg-danger-surface",
  };
  return `${base} ${variants[variant]} ${className}`;
}

function Spinner() {
  return <span aria-hidden="true" className="size-5 animate-[spin_.7s_linear_infinite] rounded-full border-2 border-current border-r-transparent"/>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean; children: ReactNode };

export function Button({ variant = "primary", loading = false, disabled, className, children, type = "button", ...rest }: ButtonProps) {
  return <button {...rest} aria-busy={loading || undefined} className={buttonClass(variant, className)} disabled={disabled || loading} type={type}>{loading ? <Spinner/> : children}</button>;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: ButtonVariant; children: ReactNode; external?: boolean };

/** A link that looks like a Button. `external` uses a plain anchor (downloads, full page loads). */
export function ButtonLink({ variant = "primary", className, children, href, external = false, ...rest }: ButtonLinkProps) {
  if (external) return <a {...rest} className={buttonClass(variant, className)} href={href}>{children}</a>;
  return <Link {...rest} className={buttonClass(variant, className)} href={href}>{children}</Link>;
}
