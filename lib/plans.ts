/**
 * Subscription plans, copied from mobile/lib/plans.ts.
 *
 * Prices are the client's, set 10 October 2026: Monthly ₦30,000, Quarterly ₦85,000, Yearly
 * ₦300,000. Every plan buys the same thing; only the term differs. Entitlement is granted by a
 * payment webhook on the server, never by this screen.
 *
 * These amounts are only what the app displays. When Paystack is wired, the price charged must be
 * set by the server, never taken from this file, or a client could choose what it pays.
 */
export type PlanOption = { id: "monthly" | "quarterly" | "yearly"; name: string; amountKobo: bigint; perMonthHint: string; highlighted?: boolean };

export const subscriptionIncludes: readonly string[] = [
  "Unlimited fee calculations, which are free in any case",
  "Payment invoices to issue to your client",
  "Terms of engagement letters for your client",
  "Branch verification of your payment",
  "Certificate of Compliance, with a publicly verifiable reference",
];

export const planOptions: readonly PlanOption[] = [
  { id: "monthly", name: "Monthly", amountKobo: 30_000n * 100n, perMonthHint: "₦30,000 a month" },
  { id: "quarterly", name: "Quarterly", amountKobo: 85_000n * 100n, perMonthHint: "about ₦28,333 a month", highlighted: true },
  { id: "yearly", name: "Yearly", amountKobo: 300_000n * 100n, perMonthHint: "₦25,000 a month" },
];
