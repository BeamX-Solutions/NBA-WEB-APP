import { ButtonLink } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { Screen } from "@/components/mobile/screen";
import { formatProfileDate } from "@/lib/profile/format";
import { referenceFrom, type Confirmation } from "@/lib/subscriptions/contracts";
import { confirmCheckout } from "@/lib/subscriptions/functions";
import { requireSession } from "@/lib/supabase/request";

/**
 * Paystack sends the practitioner back here with ?reference=. The server asks Paystack whether it
 * was paid, through subscription-confirm, and only then is the subscription granted. Nothing in the
 * address is believed beyond the reference itself, and only its owner may confirm it.
 */

type View = { icon: string; tone: string; title: string; body: string; action: { href: string; label: string; external?: boolean } };

function viewOf(result: Confirmation | null, error: string | null, reference: string | null): View {
  const tryAgain = { href: "/profile/plans", label: "Back to Plans" };
  if (reference === null) {
    return { icon: "error-outline", tone: "text-danger", title: "No payment to check", body: "This page is opened by Paystack after a payment. Choose a plan to start one.", action: tryAgain };
  }
  if (error !== null || result === null) {
    return { icon: "error-outline", tone: "text-danger", title: "We could not check your payment", body: error ?? "Please try again in a moment.", action: { href: `/profile/plans/confirm?reference=${encodeURIComponent(reference)}`, label: "Check again", external: true } };
  }
  if (result.status === "active") {
    return { icon: "check-circle", tone: "text-success", title: "Your subscription is active", body: `Thank you. It runs until ${formatProfileDate(result.expiresAt)}, and you can now generate invoices.`, action: { href: "/profile", label: "Go to Profile" } };
  }
  if (result.status === "pending") {
    return { icon: "hourglass-top", tone: "text-accent-text", title: "Still confirming your payment", body: "Paystack has not confirmed this payment yet. If you completed it, check again in a minute. You will not be charged twice.", action: { href: `/profile/plans/confirm?reference=${encodeURIComponent(reference)}`, label: "Check again", external: true } };
  }
  return { icon: "error-outline", tone: "text-danger", title: "Payment not completed", body: "Paystack did not take this payment, so nothing was charged and no subscription was started.", action: { href: "/profile/plans", label: "Try again" } };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ reference?: string | string[]; trxref?: string | string[] }> }) {
  const reference = referenceFrom(await searchParams);
  const { client } = await requireSession(reference ? `/profile/plans/confirm?reference=${encodeURIComponent(reference)}` : "/profile/plans");
  const outcome = reference === null ? null : await confirmCheckout(client, reference);
  const view = viewOf(outcome?.data ?? null, outcome?.error ?? null, reference);

  return <Screen>
    <Card className="mt-6 flex flex-col items-center text-center">
      <Icon className={view.tone} name={view.icon} size={48}/>
      <h1 className="mt-3 font-heading text-heading leading-tight font-bold text-text">{view.title}</h1>
      <p className="mt-2 text-body leading-[21px] text-text-muted">{view.body}</p>
      <div className="mt-5 w-full"><ButtonLink external={view.action.external} href={view.action.href}>{view.action.label}</ButtonLink></div>
    </Card>
  </Screen>;
}
