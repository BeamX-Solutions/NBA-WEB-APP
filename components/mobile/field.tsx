"use client";

import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { controlClass, inputClass } from "./control";
import { Icon } from "./icon";

/** mobile/components/ui/Field: 14 semibold label, 50px control, 12 hint or error below. */
export function Field({ children, error, hint, hideLabel = false, htmlFor, label, labelAside }: { children: ReactNode; error?: string; hint?: string; hideLabel?: boolean; htmlFor?: string; label: string; labelAside?: ReactNode }) {
  return <div className="mb-4">
    {hideLabel ? <label className="sr-only" htmlFor={htmlFor}>{label}</label> : <div className="mb-2 flex items-center justify-between gap-2"><label className="text-label font-semibold text-text" htmlFor={htmlFor}>{label}</label>{labelAside}</div>}
    {children}
    {error ? <p className="mt-1 text-caption text-danger" id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">{error}</p> : hint ? <p className="mt-1 text-caption text-text-muted" id={htmlFor ? `${htmlFor}-hint` : undefined}>{hint}</p> : null}
  </div>;
}


type Common = { label: string; hint?: string; error?: string; prefix?: string; locked?: boolean; trailing?: ReactNode; labelAside?: ReactNode };

type TextFieldProps = Common & InputHTMLAttributes<HTMLInputElement> & { multiline?: false };
type TextAreaProps = Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

/** Text input with an optional fixed prefix ("₦", "SCN-") and a locked, greyed state. */
export function TextField(props: TextFieldProps | TextAreaProps) {
  const generated = useId();
  const { label, hint, error, prefix, locked, trailing, labelAside, id = generated } = props;
  const aria = { "aria-describedby": describedBy(id, error, hint), "aria-invalid": Boolean(error) || undefined };
  let control: ReactNode;
  if (props.multiline) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { label: _l, hint: _h, error: _e, prefix: _p, locked: _k, trailing: _t, labelAside: _a, multiline: _m, className, ...rest } = props;
    control = <textarea {...rest} {...aria} className={`${inputClass} min-h-[72px] resize-y ${className ?? ""}`} disabled={locked || rest.disabled} id={id}/>;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { label: _l, hint: _h, error: _e, prefix: _p, locked: _k, trailing: _t, labelAside: _a, multiline: _m, className, ...rest } = props;
    control = <input {...rest} {...aria} className={`${inputClass} ${className ?? ""}`} disabled={locked || rest.disabled} id={id}/>;
  }
  return <Field error={error} hint={hint} htmlFor={id} label={label} labelAside={labelAside}>
    <div className={controlClass(error, locked)}>{prefix ? <span className="text-body-lg text-text">{prefix}</span> : null}{control}{trailing}</div>
  </Field>;
}

export type SelectOption = { value: string; label: string };

/** Above this many options the sheet gains a search box, as on mobile. */
const SEARCH_THRESHOLD = 10;

/**
 * mobile SelectField: a bordered control that opens a bottom sheet (a centred dialog from 800px).
 * Works controlled (value/onChange) or uncontrolled (defaultValue), and posts `name` with forms.
 */
export function SelectField({ defaultValue = "", disabled = false, error, hideLabel = false, hint, id: givenId, label, name, onChange, options, placeholder, value }: {
  defaultValue?: string; disabled?: boolean; error?: string; hideLabel?: boolean; hint?: string; id?: string; label: string; name?: string;
  onChange?: (value: string) => void; options: readonly SelectOption[]; placeholder: string; value?: string;
}) {
  const generated = useId();
  const id = givenId ?? generated;
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const current = value ?? internal;
  const selected = options.find((option) => option.value === current);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function choose(next: string) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return <Field error={error} hideLabel={hideLabel} hint={hint} htmlFor={id} label={label}>
    {name ? <input name={name} type="hidden" value={current}/> : null}
    <button aria-describedby={describedBy(id, error, hint)} aria-expanded={open} aria-haspopup="dialog" className={`${controlClass(error, disabled)} w-full justify-between text-left`} disabled={disabled} id={id} onClick={() => setOpen(true)} ref={triggerRef} type="button">
      <span className={`min-w-0 flex-1 truncate text-body-lg ${selected ? "text-text" : "text-text-disabled"} ${disabled ? "text-text-muted" : ""}`}>{selected?.label ?? placeholder}</span>
      <Icon color={disabled ? "var(--color-text-disabled)" : "var(--color-text-muted)"} name="expand-more" size={22}/>
    </button>
    {open ? <SelectSheet label={label} onClose={() => { setOpen(false); triggerRef.current?.focus(); }} onSelect={choose} options={options} selected={current}/> : null}
  </Field>;
}

function SelectSheet({ label, onClose, onSelect, options, selected }: { label: string; onClose: () => void; onSelect: (value: string) => void; options: readonly SelectOption[]; selected: string }) {
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const showSearch = options.length > SEARCH_THRESHOLD;
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;
  }, [options, query]);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button, input"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, []);

  return <div className="fixed inset-0 z-50 flex items-end justify-center min-[800px]:items-center">
    <button aria-label="Close" className="absolute inset-0 border-0 bg-scrim" onClick={onClose} tabIndex={-1} type="button"/>
    <div aria-label={label} aria-modal="true" className="relative flex max-h-[70dvh] w-full max-w-[560px] flex-col rounded-t-[20px] bg-surface px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] min-[800px]:rounded-[20px]" ref={panelRef} role="dialog">
      <span className="mx-auto mb-3 h-1 w-10 rounded-full bg-border"/>
      <div className="mb-3 flex items-center justify-between"><h2 className="m-0 text-title font-bold text-text">{label}</h2><button aria-label="Close" className="grid place-items-center border-0 bg-transparent p-1 text-text-muted" data-autofocus={showSearch ? undefined : true} onClick={onClose} type="button"><Icon name="close" size={24}/></button></div>
      {showSearch ? <div className={`${controlClass()} mb-2`}><Icon color="var(--color-text-muted)" name="search" size={20}/><input aria-label={`Search ${label}`} autoComplete="off" className={inputClass} data-autofocus onChange={(event) => setQuery(event.target.value)} placeholder="Search" type="search" value={query}/></div> : null}
      <div className="overflow-y-auto" role="listbox">
        {visible.length ? visible.map((option) => {
          const isSelected = option.value === selected;
          return <button aria-selected={isSelected} className="flex w-full items-center justify-between gap-3 border-0 border-b border-border bg-transparent py-3 text-left text-body-lg hover:bg-surface-muted" key={option.value} onClick={() => onSelect(option.value)} role="option" type="button">
            <span className={isSelected ? "font-bold text-primary" : "text-text"}>{option.label}</span>
            {isSelected ? <Icon color="var(--color-primary)" name="check" size={20}/> : null}
          </button>;
        }) : <p className="py-6 text-center text-body text-text-muted">No matches.</p>}
      </div>
    </div>
  </div>;
}
