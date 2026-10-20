"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/mobile/button";
import { Icon } from "@/components/mobile/icon";

/**
 * Asks before signing out, the same way here, in the mobile app and in the admin console.
 *
 * Calm on purpose. Signing out loses nothing (signing back in is the undo), so it is not dressed as
 * a warning: a neutral icon, one line, and Cancel and Sign out side by side in the app's green.
 * Behaves as ConfirmDialog does: Escape and the backdrop cancel (unless busy), focus stays inside
 * and returns to the button that opened it.
 */
export function SignOutDialog({ busy = false, onCancel, onConfirm }: { busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
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
    <button aria-label="Cancel" className="absolute inset-0 border-0 bg-scrim" onClick={busy ? undefined : onCancel} tabIndex={-1} type="button"/>
    <div aria-describedby="sign-out-body" aria-labelledby="sign-out-title" aria-modal="true" className="relative flex w-full max-w-[380px] flex-col items-center rounded-card bg-surface p-6 text-center" ref={panelRef} role="dialog">
      <span className="mb-3 grid size-[52px] place-items-center rounded-full bg-primary-surface text-primary"><Icon name="logout" size={24}/></span>
      <h2 className="m-0 font-heading text-title font-bold text-text" id="sign-out-title">Sign out?</h2>
      <p className="mt-2 text-body leading-[21px] text-text-muted" id="sign-out-body">You&apos;ll need your email and password to sign back in.</p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Button data-autofocus disabled={busy} onClick={onCancel} variant="outline">Cancel</Button>
        <Button loading={busy} onClick={onConfirm}>Sign out</Button>
      </div>
    </div>
  </div>;
}
