"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Button } from "@/components/mobile/button";
import { ATTRIBUTION, PRODUCT_NAME } from "@/lib/branding";
import { hasSeenOnboarding, markOnboardingSeen, slides } from "@/lib/onboarding";

function storage(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

/**
 * mobile app/onboarding.tsx, shown over the login screen on a browser's first visit. Swipe on touch,
 * arrow keys on a keyboard; Skip or Get started never shows it again in this browser.
 */
export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const isLast = index === slides.length - 1;

  // Read after mount: the server cannot know, and rendering the login first avoids a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off read of device storage on mount
    if (!hasSeenOnboarding(storage())) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((current) => Math.min(current + 1, slides.length - 1));
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(current - 1, 0));
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function finish() {
    markOnboardingSeen(storage());
    setOpen(false);
  }

  function onTouchEnd(event: TouchEvent) {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (delta < -50) setIndex((current) => Math.min(current + 1, slides.length - 1));
    if (delta > 50) setIndex((current) => Math.max(current - 1, 0));
  }

  if (!open) return null;
  const slide = slides[index];

  return <div aria-label="Welcome to NBA Legal Fees" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog">
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col" onTouchEnd={onTouchEnd} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}>
      <div className="relative h-[340px] shrink-0">
        <Image alt="" className="object-cover" fill priority sizes="480px" src={slide.image}/>
        {/* Softens the foot of the photo into the page, as on mobile. */}
        <div className="absolute inset-x-0 bottom-0 h-8 rounded-t-[28px] bg-background"/>
        <div className="absolute inset-x-4 top-[max(8px,env(safe-area-inset-top))] flex items-center justify-between">
          <Image alt="Nigerian Bar Association seal" className="size-11 object-contain" height={44} src="/nba-seal.png" width={44}/>
          <button aria-label="Skip onboarding" className="rounded-full border-0 bg-surface px-3 py-[6px] text-label font-semibold text-text" onClick={finish} type="button">Skip</button>
        </div>
      </div>
      <div aria-live="polite" className="px-6 pt-4 text-center">
        <h2 className="m-0 font-heading text-heading font-bold text-text">{slide.title}</h2>
        <p className="mt-3 text-body-lg leading-6 text-text-muted">{slide.body}</p>
      </div>
      <div className="mt-auto flex flex-col gap-4 px-6 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex justify-center gap-2">{slides.map((item, dot) => <button aria-current={dot === index ? "step" : undefined} aria-label={`Slide ${dot + 1} of ${slides.length}`} className={`h-2 rounded-full border-0 p-0 transition-all ${dot === index ? "w-[22px] bg-primary" : "w-2 bg-border-strong"}`} key={item.title} onClick={() => setIndex(dot)} type="button"/>)}</div>
        <Button onClick={() => (isLast ? finish() : setIndex(index + 1))}>{isLast ? "Get started" : "Next"}</Button>
        <p className="text-center text-caption text-text-muted">{PRODUCT_NAME} - {ATTRIBUTION}</p>
      </div>
    </div>
  </div>;
}
