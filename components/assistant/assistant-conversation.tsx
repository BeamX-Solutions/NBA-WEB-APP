"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/mobile/icon";
import { MAX_QUESTION_LENGTH, SUGGESTED_QUESTIONS, type ChatMessage } from "@/lib/assistant/contracts";
import { AssistantReply } from "./assistant-reply";

/** Four lines of 22px text plus padding: the composer grows to this, then scrolls. */
const COMPOSER_MAX_HEIGHT = 112;

function Bubble({ message, onLinkClick }: { message: ChatMessage; onLinkClick: () => void }) {
  if (message.role === "user") {
    return <li className="flex justify-end">
      <p className="m-0 max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-[4px] bg-primary px-4 py-[10px] text-body leading-[22px] text-text-inverse">{message.content}</p>
    </li>;
  }
  return <li className="flex justify-start">
    <div className="max-w-[85%] rounded-[18px] rounded-bl-[4px] border border-border bg-surface px-4 py-[10px] text-body leading-[22px] text-text">
      <AssistantReply content={message.content} onLinkClick={onLinkClick}/>
    </div>
  </li>;
}

function TypingDots() {
  return <li className="flex justify-start" role="status">
    <span className="sr-only">The assistant is answering</span>
    <span aria-hidden="true" className="flex items-center gap-1 rounded-[18px] rounded-bl-[4px] border border-border bg-surface px-4 py-[14px]">
      {[0, 160, 320].map((delay) => <span className="size-2 animate-pulse rounded-full bg-text-muted" key={delay} style={{ animationDelay: `${delay}ms` }}/>)}
    </span>
  </li>;
}

function Greeting({ disabled, onAsk }: { disabled: boolean; onAsk: (question: string) => void }) {
  return <div className="flex flex-col items-center px-2 pt-6 text-center">
    <span className="grid size-14 place-items-center rounded-full bg-primary-surface text-primary"><Icon name="smart-toy" size={30}/></span>
    <p className="mt-3 mb-0 text-body-lg font-semibold text-text">Hi, how can I help?</p>
    <p className="mt-1 mb-0 text-label leading-[20px] text-text-muted">I can answer questions about your invoices, certificates, payments and fees.</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {SUGGESTED_QUESTIONS.map((question) => <button
        className="rounded-full border-0 bg-primary-surface px-3 py-2 text-label font-semibold text-primary hover:bg-success-surface disabled:opacity-50"
        disabled={disabled}
        key={question}
        onClick={() => onAsk(question)}
        type="button"
      >{question}</button>)}
    </div>
  </div>;
}

/**
 * The messages, newest at the bottom, and the composer pinned beneath them. Enter sends on a
 * desktop; on a phone the Enter key adds a line and the send button sends, as in messaging apps.
 */
export function AssistantConversation({ asking, error, messages, offline, onAsk, onLinkClick, sendOnEnter }: {
  asking: boolean; error: string; messages: ChatMessage[]; offline: boolean;
  onAsk: (question: string) => Promise<boolean>; onLinkClick: () => void; sendOnEnter: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages, asking, error]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "auto";
    composer.style.height = `${Math.min(composer.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [draft]);

  const canSend = draft.trim() !== "" && !asking && !offline;

  async function ask(question: string) {
    if (asking || offline || !question.trim()) return;
    setDraft("");
    // A failed question comes back to the composer.
    if (!await onAsk(question)) setDraft(question);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canSend) void ask(draft);
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!sendOnEnter || event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) void ask(draft);
  }

  return <>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background px-4 py-4" ref={listRef}>
      {messages.length === 0 && !asking
        ? <Greeting disabled={offline} onAsk={(question) => void ask(question)}/>
        : <ol aria-label="Conversation" aria-live="polite" className="m-0 flex list-none flex-col gap-2 p-0">
          {messages.map((message) => <Bubble key={message.id} message={message} onLinkClick={onLinkClick}/>)}
          {asking ? <TypingDots/> : null}
        </ol>}
    </div>

    <form className="shrink-0 border-t border-border bg-surface px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]" onSubmit={submit}>
      {error ? <p className="m-0 mb-2 px-1 text-label leading-[19px] text-danger" role="alert">{error}</p> : null}
      {offline ? <p className="m-0 mb-2 px-1 text-label text-text-muted">You are offline. Reconnect to send.</p> : null}
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="assistant-composer">Ask the assistant</label>
        <textarea
          className="min-h-11 flex-1 resize-none rounded-[22px] border border-border-strong bg-surface px-4 py-[10px] text-body-lg leading-[22px] text-text outline-none placeholder:text-text-disabled focus:border-primary"
          data-autofocus=""
          enterKeyHint={sendOnEnter ? "send" : "enter"}
          id="assistant-composer"
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={keyDown}
          placeholder="Ask about your work…"
          ref={composerRef}
          rows={1}
          value={draft}
        />
        <button
          aria-label="Send"
          className="grid size-11 shrink-0 place-items-center rounded-full border-0 bg-primary text-text-inverse hover:bg-primary-pressed disabled:bg-border-strong"
          disabled={!canSend}
          type="submit"
        ><Icon name="arrow-upward" size={22}/></button>
      </div>
    </form>
  </>;
}
