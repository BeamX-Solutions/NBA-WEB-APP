"use client";

import { useState } from "react";
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

/**
 * mobile subscription/plans. Payment is not connected on mobile either: entitlement must come from a
 * server webhook, so continuing explains that instead of charging.
 */
export function ProfilePlans() {
  const [selected, setSelected] = useState("quarterly");
  const [continued, setContinued] = useState(false);
  return <Screen>
    <div className="mb-4 text-center">
      <h1 className="m-0 text-heading font-bold text-text">Choose Your Plan</h1>
      <p className="mt-2 text-body leading-[21px] text-text-muted">Choose how long you want to subscribe for. Every plan includes the same services, so the only difference is the term.</p>
    </div>
    <Card className="mb-4 grid gap-2">
      <p className="mb-1 text-caption font-bold tracking-[0.6px] text-text-muted uppercase">Every plan includes</p>
      {subscriptionIncludes.map((line) => <div className="flex items-start gap-2" key={line}><Icon color="var(--color-success)" name="check-circle-outline" size={18}/><span className="flex-1 text-body text-text">{line}</span></div>)}
    </Card>
    <div aria-label="Plans" className="pt-3" role="radiogroup">{planOptions.map((plan) => <PlanCard key={plan.id} onSelect={() => { setSelected(plan.id); setContinued(false); }} plan={plan} selected={selected === plan.id}/>)}</div>
    <div className="mt-2"><Button onClick={() => setContinued(true)}>Continue to Payment</Button></div>
    {continued ? <Notice className="mt-3" tone="info"><strong className="block">Payment not yet available</strong>Card payment is not connected yet. Your subscription will activate once payment is confirmed by the server.</Notice> : null}
  </Screen>;
}
