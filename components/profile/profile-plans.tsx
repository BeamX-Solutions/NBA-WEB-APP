"use client";

import { useActionState, useState } from "react";
import { startCheckoutAction, type CheckoutActionState } from "@/app/(practitioner)/profile/plans/actions";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { Screen } from "@/components/mobile/screen";
import { Notice } from "@/components/mobile/states";
import { formatNaira } from "@/lib/fees/legal-fees";
import { planOptions, subscriptionIncludes, type PlanOption } from "@/lib/plans";

function PlanCard({ onSelect, plan, selected }: { onSelect: () => void; plan: PlanOption; selected: boolean }) {
  return <div aria-checked={selected} className={`relative mb-4 cursor-pointer rounded-card bg-surface p-4 ${selected ? "border-2 border-primary" : "border border-border"}`} onClick={onSelect} role="radio" tabIndex={-1}>
    {plan.highlighted ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-caption font-semibold text-text-inverse">Best value</span> : null}
    <h2 className="m-0 text-title font-bold text-text">{plan.name}</h2>
    <p className="mt-1 text-display leading-tight font-bold text-primary">{formatNaira(plan.amountKobo)}</p>
    <p className="mb-4 text-body text-text-muted">{plan.perMonthHint}</p>
    <Button onClick={(event) => { event.stopPropagation(); onSelect(); }} variant={selected ? "primary" : "outline"}>{selected ? `${plan.name} selected` : `Select ${plan.name}`}</Button>
  </div>;
}

const initialState: CheckoutActionState = { message: "", status: "idle" };

/**
 * mobile subscription/plans. Continuing starts a Paystack checkout on the server, which prices the
 * plan itself, and sends the practitioner to Paystack. The subscription is granted only once the
 * server has confirmed the payment with Paystack (profile/plans/confirm, and the webhook).
 */
export function ProfilePlans() {
  const [selected, setSelected] = useState("quarterly");
  const [state, formAction, pending] = useActionState(startCheckoutAction, initialState);
  return <Screen>
    <div className="mb-4 text-center">
      <h1 className="m-0 text-heading font-bold text-text">Choose Your Plan</h1>
      <p className="mt-2 text-body leading-[21px] text-text-muted">Choose how long you want to subscribe for. Every plan includes the same services, so the only difference is the term.</p>
    </div>
    <Card className="mb-4 grid gap-2">
      <p className="mb-1 text-caption font-bold tracking-[0.6px] text-text-muted uppercase">Every plan includes</p>
      {subscriptionIncludes.map((line) => <div className="flex items-start gap-2" key={line}><Icon color="var(--color-success)" name="check-circle-outline" size={18}/><span className="flex-1 text-body text-text">{line}</span></div>)}
    </Card>
    <div aria-label="Plans" className="pt-3" role="radiogroup">{planOptions.map((plan) => <PlanCard key={plan.id} onSelect={() => setSelected(plan.id)} plan={plan} selected={selected === plan.id}/>)}</div>
    <form action={formAction} className="mt-2">
      <input name="plan" type="hidden" value={selected}/>
      <Button loading={pending} type="submit">Continue to Payment</Button>
    </form>
    <p className="mt-3 flex items-center justify-center gap-1 text-label text-text-muted"><Icon name="lock-outline" size={16}/>Secured by Paystack</p>
    {state.status === "error" ? <Notice className="mt-3" tone="error">{state.message}</Notice> : null}
  </Screen>;
}
