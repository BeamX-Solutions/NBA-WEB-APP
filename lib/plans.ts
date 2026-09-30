/**
 * Subscription plans, copied from mobile/lib/plans.ts.
 *
 * PLACEHOLDER PRICING pending the client's figures: these amounts must not be charged. Every plan
 * buys the same thing; only the term differs. Entitlement is granted by a payment webhook on the
 * server, never by this screen.
 */
export type PlanOption = { id: "monthly" | "quarterly" | "yearly"; name: string; amountKobo: bigint; perMonthHint: string; highlighted?: boolean };

export const subscriptionIncludes: readonly string[] = [
  "Unlimited fee calculations, which are free in any case",
  "Payment invoices to issue to your client",
  "Branch verification of your payment",
  "Certificate of Compliance, with a publicly verifiable reference",
];

export const planOptions: readonly PlanOption[] = [
  { id: "monthly", name: "Monthly", amountKobo: 1_500n * 100n, perMonthHint: "₦1,500 a month" },
  { id: "quarterly", name: "Quarterly", amountKobo: 4_000n * 100n, perMonthHint: "about ₦1,333 a month", highlighted: true },
  { id: "yearly", name: "Yearly", amountKobo: 14_000n * 100n, perMonthHint: "about ₦1,167 a month" },
];
