"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { ConfirmDialog } from "@/components/mobile/confirm-dialog";
import { Icon } from "@/components/mobile/icon";
import { Spinner } from "@/components/mobile/states";
import { isTabPath } from "@/components/mobile/tab-nav";
import { clearConversation, openAssistant, sendQuestion } from "@/lib/assistant/client";
import type { AssistantState, ChatMessage } from "@/lib/assistant/contracts";
import { useOnline } from "@/lib/use-online";
import { AssistantConversation } from "./assistant-conversation";

const DESKTOP = "(min-width: 800px)";

/** How far the sheet must be dragged down before letting go closes it. */
const DRAG_TO_CLOSE = 100;

/** Movement before a press on the header counts as a drag rather than a tap. */
const DRAG_SLOP = 8;

function subscribeToWidth(notify: () => void): () => void {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** Phones are the default; the server render and first paint assume one. */
function useDesktop(): boolean {
  return useSyncExternalStore(subscribeToWidth, () => window.matchMedia(DESKTOP).matches, () => false);
}

function subscribeToViewport(notify: () => void): () => void {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", notify);
  viewport?.addEventListener("scroll", notify);
  return () => {
    viewport?.removeEventListener("resize", notify);
    viewport?.removeEventListener("scroll", notify);
  };
}

/** "top,height" of the visible area while a keyboard covers part of the screen, or "" when none does. */
function keyboardSnapshot(): string {
  const viewport = window.visualViewport;
  if (!viewport || viewport.height >= document.documentElement.clientHeight * 0.8) return "";
  return `${Math.round(viewport.offsetTop)},${Math.round(viewport.height)}`;
}

/**
 * The part of the screen the keyboard leaves visible, or null when no keyboard is open. The sheet
 * grows to fill it, so the composer stays above the keyboard on iOS and Android alike.
 */
function useKeyboardArea(): { top: number; height: number } | null {
  const snapshot = useSyncExternalStore(subscribeToViewport, keyboardSnapshot, () => "");
  if (!snapshot) return null;
  const [top, height] = snapshot.split(",").map(Number);
  return { top, height };
}

type Load = { status: "idle" | "loading" } | { status: "failed"; error: string } | { status: "loaded"; state: AssistantState };

type DragHandlers = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
};

function Header({ desktop, drag, onClear, onClose }: { desktop: boolean; drag: DragHandlers | null; onClear: (() => void) | null; onClose: () => void }) {
  return <div className={`shrink-0 bg-primary px-2 pb-3 text-text-inverse ${desktop ? "pt-3" : "touch-none pt-2"}`} {...drag} onPointerCancel={drag?.onPointerUp}>
    {desktop ? null : <span aria-hidden="true" className="mx-auto mb-2 block h-1 w-10 rounded-full bg-text-inverse/40"/>}
    <div className="flex items-center gap-2">
      <button aria-label="Close the assistant" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-text-inverse hover:bg-primary-pressed" onClick={onClose} type="button">
        <Icon name={desktop ? "close" : "keyboard-arrow-down"} size={desktop ? 22 : 28}/>
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="m-0 font-heading text-body-lg leading-tight font-bold" id="assistant-title">Assistant</h2>
        <p className="m-0 text-caption text-text-inverse/80">Answers from your own records</p>
      </div>
      {onClear ? <button className="rounded-button border-0 bg-transparent px-3 py-2 text-label font-semibold text-text-inverse hover:bg-primary-pressed" onClick={onClear} type="button">Clear</button> : null}
    </div>
  </div>;
}

function NotSubscribed({ onPlans }: { onPlans: () => void }) {
  return <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 text-center">
    <span className="grid size-14 place-items-center rounded-full bg-accent-surface text-accent-text"><Icon name="workspace-premium" size={30}/></span>
    <p className="mt-3 mb-0 text-body-lg font-semibold text-text">The assistant comes with a subscription</p>
    <p className="mt-1 mb-0 text-label leading-[20px] text-text-muted">Ask what is pending, what your branch has paid you, or the minimum fee for a document.</p>
    <Link className="mt-5 inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 text-body font-semibold text-text-inverse hover:bg-primary-pressed" href="/profile/plans" onClick={onPlans}>View plans</Link>
  </div>;
}

function Failed({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 text-center">
    <Icon className="text-danger" name="cloud-off" size={32}/>
    <p className="mt-3 mb-0 text-body text-text">{error}</p>
    <button className="mt-4 rounded-button border-[1.5px] border-primary bg-surface px-4 py-2 text-body font-semibold text-primary hover:bg-success-surface" onClick={onRetry} type="button">Try again</button>
  </div>;
}

/**
 * The assistant as a floating button at the bottom right of every practitioner screen. On a phone
 * it opens a sheet over 90% of the screen, with the page dimmed above it: tap the page or drag the
 * sheet down to close it. While the keyboard is up the sheet fills what remains visible. From
 * 800px it is a 380px panel at the bottom right. The frame persists between pages, so the
 * conversation stays loaded once opened.
 */
export function AssistantLauncher() {
  const pathname = usePathname();
  const desktop = useDesktop();
  const online = useOnline();
  const keyboard = useKeyboardArea();
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<Load>({ status: "idle" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef<{ startY: number; dragging: boolean; offset: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchState = useCallback(async () => {
    setLoad({ status: "loading" });
    const result = await openAssistant();
    if (result.error !== null) { setLoad({ status: "failed", error: result.error }); return; }
    if (result.data.kind === "ready") setMessages(result.data.messages);
    setLoad({ status: "loaded", state: result.data });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setDragY(0);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  function openChat() {
    setOpen(true);
    if (load.status === "idle" || load.status === "failed") void fetchState();
  }

  // On a phone the sheet covers the page: lock the page behind it. Escape closes it anywhere.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    if (!desktop) document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirmingClear) { event.preventDefault(); close(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [open, desktop, confirmingClear, close, load.status]);

  // Dragging the header down moves the sheet with the finger; far enough and it closes.
  const drag: DragHandlers = {
    onPointerDown(event) { dragRef.current = { startY: event.clientY, dragging: false, offset: 0 }; },
    onPointerMove(event) {
      const state = dragRef.current;
      if (!state) return;
      const offset = Math.max(0, event.clientY - state.startY);
      if (!state.dragging && offset > DRAG_SLOP) {
        state.dragging = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (!state.dragging) return;
      state.offset = offset;
      setDragY(offset);
    },
    onPointerUp() {
      const state = dragRef.current;
      dragRef.current = null;
      if (!state?.dragging) return;
      if (state.offset > DRAG_TO_CLOSE) close();
      else setDragY(0);
    },
  };

  async function ask(question: string): Promise<boolean> {
    const trimmed = question.trim();
    setError("");
    setAsking(true);
    setMessages((current) => [...current, { id: `pending-${Date.now()}`, role: "user", content: trimmed }]);
    const result = await sendQuestion(trimmed);
    setAsking(false);
    if (result.error !== null) {
      setMessages((current) => current.slice(0, -1));
      setError(result.error);
      return false;
    }
    setMessages((current) => [...current, { id: `reply-${Date.now()}`, role: "assistant", content: result.data }]);
    return true;
  }

  async function clear() {
    setClearing(true);
    const result = await clearConversation();
    setClearing(false);
    setConfirmingClear(false);
    if (result.error !== null) { setError(result.error); return; }
    setError("");
    setMessages([]);
  }

  // A link in a reply opens that screen; on a phone the sheet steps out of the way.
  const followLink = desktop ? () => undefined : close;
  const aboveTabBar = isTabPath(pathname) && !desktop;
  const ready = load.status === "loaded" && load.state.kind === "ready";
  // No transition while the finger is moving it; letting go animates it back or away.
  const dragging = dragY > 0;

  const panelClass = desktop
    ? "fixed right-4 bottom-4 z-40 flex h-[min(600px,calc(100dvh-120px))] w-[380px] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-[0_12px_40px_rgb(17_24_19/0.18)]"
    : `fixed inset-x-0 z-40 flex flex-col overflow-hidden bg-surface shadow-[0_-8px_30px_rgb(17_24_19/0.18)] animate-[sheet-up_.24s_ease-out] ${keyboard ? "" : "bottom-0 h-[90dvh] rounded-t-[20px]"} ${dragging ? "" : "transition-transform duration-200"}`;
  const panelStyle = desktop ? undefined : {
    transform: dragY ? `translateY(${dragY}px)` : undefined,
    ...(keyboard ? { top: keyboard.top, height: keyboard.height } : {}),
  };

  return <>
    {open ? null : <button
      aria-label="Ask the assistant"
      className={`fixed right-4 z-30 grid size-14 place-items-center rounded-full border-0 bg-primary text-text-inverse shadow-[0_6px_20px_rgb(11_93_51/0.35)] hover:bg-primary-pressed active:scale-95 ${aboveTabBar ? "bottom-[calc(84px+env(safe-area-inset-bottom))]" : "bottom-[calc(16px+env(safe-area-inset-bottom))]"}`}
      onClick={openChat}
      ref={buttonRef}
      type="button"
    ><Icon name="smart-toy" size={28}/></button>}

    {open && !desktop ? <button aria-label="Close the assistant" className="fixed inset-0 z-40 border-0 bg-scrim animate-[fade-in_.2s_ease-out]" onClick={close} tabIndex={-1} type="button"/> : null}

    {open ? <div aria-labelledby="assistant-title" aria-modal={desktop ? undefined : true} className={panelClass} ref={panelRef} role="dialog" style={panelStyle}>
      <Header desktop={desktop} drag={desktop ? null : drag} onClear={ready && messages.length > 0 ? () => setConfirmingClear(true) : null} onClose={close}/>
      {load.status === "loaded" && load.state.kind === "not-subscribed" ? <NotSubscribed onPlans={close}/> : null}
      {load.status === "failed" ? <Failed error={load.error} onRetry={() => void fetchState()}/> : null}
      {load.status === "loading" || load.status === "idle" ? <div className="flex flex-1 items-center justify-center bg-background" role="status"><Spinner/><span className="sr-only">Opening the assistant</span></div> : null}
      {ready ? <AssistantConversation asking={asking} error={error} messages={messages} offline={!online} onAsk={ask} onLinkClick={followLink} sendOnEnter={desktop}/> : null}
    </div> : null}

    {confirmingClear ? <ConfirmDialog
      body="Your messages with the assistant will be removed from this chat."
      busy={clearing}
      confirmLabel="Clear"
      destructive
      onCancel={() => setConfirmingClear(false)}
      onConfirm={() => void clear()}
      title="Clear the conversation?"
    /> : null}
  </>;
}
