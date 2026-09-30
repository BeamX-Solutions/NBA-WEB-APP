import type { TransactionStatus } from "@/lib/transactions/sample-transactions";

/** mobile theme statusStyles, keyed by the web's short status names. */
const statusStyles: Record<TransactionStatus, { label: string; className: string }> = {
  awaiting: { label: "Awaiting Payment", className: "bg-accent-surface text-accent-text" },
  pending: { label: "Pending Verification", className: "bg-neutral-surface text-text-muted" },
  verified: { label: "Verified", className: "bg-success-surface text-success" },
  rejected: { label: "Rejected", className: "bg-danger-surface text-danger" },
};

const pill = "inline-flex w-max shrink-0 items-center rounded-full px-3 py-[6px] text-caption leading-none font-semibold";

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const style = statusStyles[status];
  return <span className={`${pill} ${style.className}`}>{style.label}</span>;
}

/** Generic pill, as for the certificate year and "Official Issue" markers. Success colours by default. */
export function Badge({ label, className = "bg-success-surface text-success" }: { label: string; className?: string }) {
  return <span className={`${pill} ${className}`}>{label}</span>;
}
