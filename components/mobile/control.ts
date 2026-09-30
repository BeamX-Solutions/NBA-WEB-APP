/** mobile Field control: 50px, borderStrong border (danger on error), radius 8, greyed when locked. Server-safe. */
export function controlClass(error?: string, locked?: boolean): string {
  return `flex min-h-[50px] items-center gap-2 rounded-input border bg-surface px-3 focus-within:outline-3 focus-within:outline-primary/35 ${error ? "border-danger" : "border-border-strong"} ${locked ? "bg-surface-muted" : ""}`;
}

export const inputClass = "min-w-0 flex-1 border-0 bg-transparent py-3 text-body-lg text-text outline-none placeholder:text-text-disabled disabled:text-text-muted";
