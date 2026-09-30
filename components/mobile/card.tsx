import type { HTMLAttributes } from "react";

/** mobile/components/ui/Card: white surface, soft border, radius 12, padding 16. */
export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section {...rest} className={`rounded-card border border-border bg-surface p-4 ${className}`}>{children}</section>;
}
