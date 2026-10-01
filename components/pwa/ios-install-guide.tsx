"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/mobile/button";
import { Icon } from "@/components/mobile/icon";
import { Notice } from "@/components/mobile/states";
import { PRODUCT_NAME } from "@/lib/branding";

const steps = [
  { icon: "ios-share", title: "Tap Share", detail: "At the bottom of Safari, or in the address bar in Chrome." },
  { icon: "add-box", title: "Tap Add to Home Screen", detail: "Scroll down the list if you don't see it." },
  { icon: "check-circle", title: "Tap Add", detail: `${PRODUCT_NAME} appears on your home screen. Open it from there.` },
] as const;

/**
 * The three steps to install on an iPhone or iPad, where Apple allows no install button. A bottom
 * sheet on phones and a centred dialog from 800px, like the select sheet; focus stays inside and
 * returns to whatever opened it.
 */
export function IosInstallGuide({ inAppBrowser, onClose }: { inAppBrowser: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); }
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

  return <div className="fixed inset-0 z-50 flex items-end justify-center min-[800px]:items-center">
    <button aria-label="Close" className="absolute inset-0 border-0 bg-scrim" onClick={onClose} tabIndex={-1} type="button"/>
    <div aria-labelledby="install-guide-title" aria-modal="true" className="relative flex max-h-[85dvh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-[20px] bg-surface px-4 pt-2 pb-[max(16px,env(safe-area-inset-bottom))] min-[800px]:rounded-[20px] min-[800px]:p-6" ref={panelRef} role="dialog">
      <span className="mx-auto mb-3 h-1 w-10 rounded-full bg-border min-[800px]:hidden"/>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 font-heading text-title font-bold text-text" id="install-guide-title">Add to your home screen</h2>
        <button aria-label="Close" className="grid place-items-center border-0 bg-transparent p-1 text-text-muted" onClick={onClose} type="button"><Icon name="close" size={24}/></button>
      </div>
      {inAppBrowser ? <Notice className="mb-3" tone="warning">This page is open inside another app, which cannot add it to your home screen. Tap ⋯ or the share icon and choose <strong>Open in Safari</strong>, then follow these steps.</Notice> : null}
      <ol className="m-0 list-none p-0">
        {steps.map((step, index) => <li className="flex items-start gap-3 border-b border-border py-3 last:border-b-0" key={step.title}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-surface text-primary"><Icon name={step.icon} size={22}/></span>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-semibold text-text">{index + 1}. {step.title}</span>
            <span className="mt-1 block text-label leading-[19px] text-text-muted">{step.detail}</span>
          </span>
        </li>)}
      </ol>
      {inAppBrowser ? null : <p className="mt-3 text-caption leading-[17px] text-text-muted">Don&apos;t see Add to Home Screen? If you opened this link from WhatsApp or another app, open it in Safari first.</p>}
      <div className="mt-4"><Button data-autofocus onClick={onClose}>Got it</Button></div>
    </div>
  </div>;
}
