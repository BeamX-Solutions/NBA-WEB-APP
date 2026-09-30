"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";
import { IconCircle } from "./states";

/**
 * mobile ConfirmDialog: a centred card with an icon circle, Playfair title, the confirm button and a
 * quiet cancel link. Escape and the backdrop cancel (unless busy); focus is kept inside.
 */
export function ConfirmDialog({ body, busy = false, cancelLabel = "Cancel", confirmLabel, destructive = false, onCancel, onConfirm, title }: {
  body: string; busy?: boolean; cancelLabel?: string; confirmLabel: string; destructive?: boolean;
  onCancel: () => void; onConfirm: () => void; title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  const busyRef = useRef(busy);

  useEffect(() => { cancelRef.current = onCancel; busyRef.current = busy; }, [onCancel, busy]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) { event.preventDefault(); cancelRef.current(); }
      if (event.key !== "Tab" || !panelRef.current) return;
      const buttons = Array.from(panelRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  return <div className="fixed inset-0 z-50 grid place-items-center px-6">
    <button aria-label={cancelLabel} className="absolute inset-0 border-0 bg-scrim" onClick={busy ? undefined : onCancel} tabIndex={-1} type="button"/>
    <div aria-describedby="confirm-body" aria-labelledby="confirm-title" aria-modal="true" className="relative flex w-full max-w-[420px] flex-col items-center rounded-card bg-surface p-6 text-center" ref={panelRef} role="dialog">
      <IconCircle icon={destructive ? "warning-amber" : "help-outline"} size={32} tone={destructive ? "danger" : "success"}/>
      <h2 className="m-0 font-heading text-title font-bold text-text" id="confirm-title">{title}</h2>
      <p className="mt-2 text-body leading-[21px] text-text-muted" id="confirm-body">{body}</p>
      <div className="mt-6 w-full">
        <Button loading={busy} onClick={onConfirm} variant={destructive ? "danger" : "primary"}>{confirmLabel}</Button>
        <button className="mt-1 w-full border-0 bg-transparent py-3 text-body-lg font-semibold text-text-muted" data-autofocus disabled={busy} onClick={onCancel} type="button">{cancelLabel}</button>
      </div>
    </div>
  </div>;
}
