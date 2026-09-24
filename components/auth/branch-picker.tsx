"use client";

import { useEffect, useRef } from "react";
import type { SignupBranch } from "@/lib/auth/branches";

export function BranchPicker({ branches, onClose, onSelect }: { branches: SignupBranch[]; onClose: () => void; onSelect: (branch: SignupBranch) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("[data-branch-option]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const elements = Array.from(panelRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [onClose]);

  return <div className="auth-dialog-root"><button aria-label="Close branch picker" className="auth-dialog-backdrop" onClick={onClose} type="button"/><div aria-describedby="branch-selection-note" aria-labelledby="branch-dialog-title" aria-modal="true" className="auth-branch-sheet" ref={panelRef} role="dialog"><div className="auth-sheet-handle"/><div className="auth-sheet-heading"><h2 id="branch-dialog-title">NBA Branch</h2><button aria-label="Close branch picker" className="auth-sheet-close" onClick={onClose} type="button">×</button></div><div className="auth-branch-list">{branches.map((branch) => <button className="auth-branch-option" data-branch-option key={branch.id} onClick={() => onSelect(branch)} type="button">{branch.name}{branch.state ? ` · ${branch.state}` : ""}</button>)}</div><p className="auth-sheet-note" id="branch-selection-note">Your branch selection is subject to verification.</p></div></div>;
}
