import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  children: ReactNode;
  elevation?: "flat" | "sm" | "md" | "lg";
  padding?: "none" | "compact" | "normal";
};

export function Card({
  as: Element = "div",
  children,
  className = "",
  elevation = "flat",
  padding = "normal",
  ...props
}: CardProps) {
  return (
    <Element
      className={`card card--${elevation} card--padding-${padding} ${className}`.trim()}
      {...props}
    >
      {children}
    </Element>
  );
}

