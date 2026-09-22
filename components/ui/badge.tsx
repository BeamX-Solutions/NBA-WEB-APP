import type { ReactNode } from "react";

export type BadgeTone = "brand" | "gold" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = {
  children: ReactNode;
  icon?: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, icon, tone = "neutral" }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

