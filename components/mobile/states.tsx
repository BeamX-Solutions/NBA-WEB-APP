import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/** 84px icon circle used by the empty, error and dialog states. */
export function IconCircle({ icon, tone = "success", size = 40 }: { icon: IconName; tone?: "success" | "danger" | "accent"; size?: number }) {
  const tones = { success: "bg-success-surface text-primary", danger: "bg-danger-surface text-danger", accent: "bg-accent-surface text-accent-text" };
  return <span className={`mb-4 grid size-[84px] place-items-center rounded-full ${tones[tone]}`}><Icon name={icon} size={size}/></span>;
}

function Block({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center px-4 py-8 text-center">{children}</div>;
}

/** A list that legitimately has nothing in it: explains the screen and offers the action that fills it. */
export function EmptyState({ action, body, icon, title }: { action?: ReactNode; body: string; icon: IconName; title: string }) {
  return <Block><IconCircle icon={icon}/><h2 className="m-0 font-heading text-title font-bold text-text">{title}</h2><p className="mt-2 text-body leading-[21px] text-text-muted">{body}</p>{action ? <div className="mt-6 w-full">{action}</div> : null}</Block>;
}

/** A fetch that failed, as distinct from one that succeeded with no rows. */
export function ErrorState({ action, body, title = "Something went wrong" }: { action?: ReactNode; body?: string; title?: string }) {
  return <Block><IconCircle icon="cloud-off" tone="danger"/><h2 className="m-0 font-heading text-title font-bold text-text">{title}</h2><p className="mt-2 text-body leading-[21px] text-text-muted">{body ?? "Check your connection and try again. Nothing has been lost."}</p>{action ? <div className="mt-6 w-full">{action}</div> : null}</Block>;
}

export function Spinner({ size = 36 }: { size?: number }) {
  return <span aria-hidden="true" className="inline-block animate-[spin_.8s_linear_infinite] rounded-full border-[3px] border-primary border-r-transparent" style={{ width: size, height: size }}/>;
}

/** Centred spinner for a first load. */
export function LoadingState({ label }: { label?: string }) {
  return <Block><span aria-live="polite" className="contents" role="status"><Spinner/>{label ? <p className="mt-3 text-body leading-[21px] text-text-muted">{label}</p> : <span className="sr-only">Loading</span>}</span></Block>;
}

export type NoticeTone = "error" | "success" | "info" | "warning";

/**
 * The inline boxes mobile uses: the danger error box, the amber notice, and a success or neutral note.
 * Errors are announced assertively; everything else politely.
 */
export function Notice({ children, className = "", tone }: { children: ReactNode; className?: string; tone: NoticeTone }) {
  const tones: Record<NoticeTone, { box: string; icon: IconName }> = {
    error: { box: "bg-danger-surface text-danger", icon: "error-outline" },
    success: { box: "bg-success-surface text-success", icon: "check-circle-outline" },
    info: { box: "bg-surface-muted text-text", icon: "info-outline" },
    warning: { box: "bg-accent-surface text-accent-text", icon: "info-outline" },
  };
  const style = tones[tone];
  return <div aria-live={tone === "error" ? "assertive" : "polite"} className={`flex items-start gap-2 rounded-input p-3 text-label leading-[19px] ${style.box} ${className}`} role={tone === "error" ? "alert" : "status"}><Icon name={style.icon} size={20}/><div className="min-w-0 flex-1">{children}</div></div>;
}
