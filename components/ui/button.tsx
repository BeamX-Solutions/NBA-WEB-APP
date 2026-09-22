import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "small" | "medium";

type SharedProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>;

function buttonClassName({
  className = "",
  fullWidth = false,
  size = "medium",
  variant = "primary",
}: Pick<SharedProps, "className" | "fullWidth" | "size" | "variant">) {
  return [
    "button",
    `button--${variant}`,
    `button--${size}`,
    fullWidth ? "button--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  children,
  className,
  disabled,
  fullWidth,
  iconLeading,
  iconTrailing,
  loading = false,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      className={buttonClassName({ className, fullWidth, size, variant })}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span aria-hidden="true" className="button__spinner" /> : iconLeading}
      <span>{children}</span>
      {iconTrailing}
    </button>
  );
}

export type ButtonLinkProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>;

export function ButtonLink({
  children,
  className,
  fullWidth,
  iconLeading,
  iconTrailing,
  size,
  variant,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClassName({ className, fullWidth, size, variant })} {...props}>
      {iconLeading}
      <span>{children}</span>
      {iconTrailing}
    </a>
  );
}

