import Link from "next/link";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { FormNotice } from "@/components/ui/form-notice";

export default function CertificateNotFound() {
  return <TransactionShell><main className="mx-auto max-w-[900px] p-4"><FormNotice tone="info">This certificate is unavailable or does not belong to your account.</FormNotice><Link className="mt-6 inline-block text-sm font-semibold text-[#0d5b38]" href="/certificates">← My Certificates</Link></main></TransactionShell>;
}
