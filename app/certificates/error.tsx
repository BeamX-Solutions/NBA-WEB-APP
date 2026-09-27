"use client";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { FormNotice } from "@/components/ui/form-notice";

export default function CertificatesError({ reset }: { reset: () => void }) {
  return <TransactionShell activeNavigation="certificates" showNavigation><main className="mx-auto max-w-[1080px] p-4"><FormNotice tone="error">Your certificates could not be loaded. Please try again.</FormNotice><button className="mt-5 rounded-[10px] bg-[#0d5b38] px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-nba-focus" onClick={reset} type="button">Try again</button></main></TransactionShell>;
}
