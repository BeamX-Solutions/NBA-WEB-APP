import type { ReactNode } from "react";

export type NoticeTone = "error" | "info" | "success";

export function FormNotice({ children, className = "", id, tone }: { children: ReactNode; className?: string; id?: string; tone: NoticeTone }) {
  const isError = tone === "error";
  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={`form-notice form-notice--${tone} ${className}`}
      id={id}
      role={isError ? "alert" : "status"}
    >
      <span aria-hidden="true" className="form-notice__icon">{isError ? "!" : tone === "success" ? "✓" : "i"}</span>
      <span>{children}</span>
    </div>
  );
}

