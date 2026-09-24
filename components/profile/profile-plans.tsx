"use client";

import { useState } from "react";
import { PreviewNote, ProfileCard, ProfileFrame, profileFocus, primaryButton } from "@/components/profile/profile-ui";

type Plan = "Monthly" | "Quarterly" | "Yearly";
const plans: { name: Plan; price: string; perMonth: string }[] = [
  { name: "Monthly", price: "₦1,500", perMonth: "₦1,500 a month" },
  { name: "Quarterly", price: "₦4,000", perMonth: "about ₦1,333 a month" },
  { name: "Yearly", price: "₦14,000", perMonth: "about ₦1,167 a month" },
];

export function ProfilePlans() {
  const [selected, setSelected] = useState<Plan>("Quarterly");
  const [message, setMessage] = useState("");
  return <ProfileFrame><div className="mx-auto mb-5 max-w-[760px] text-center"><h1 className="text-[27px] font-bold leading-[1.2]">Choose Your Plan</h1><p className="mt-4 text-[16px] leading-[1.5] text-[#66717e]">Choose how long you want to subscribe for. Every plan includes the same services, so the only difference is the term.</p></div><div className="mx-auto max-w-[760px] space-y-4">
    <ProfileCard><h2 className="mb-4 text-[13px] font-bold uppercase tracking-[.08em] text-[#66717e]">Every plan includes</h2><ul className="space-y-3 text-[16px] leading-[1.4]">{["Unlimited fee calculations, which are free in any case", "Payment invoices to issue to your client", "Branch verification of your payment", "Certificate of Compliance, with a publicly verifiable reference"].map((item) => <li className="flex gap-3" key={item}><span aria-hidden="true" className="font-bold text-[#168653]">✓</span>{item}</li>)}</ul></ProfileCard>
    {plans.map((plan) => <section className={`relative rounded-[14px] border-2 bg-white p-4 min-[800px]:p-6 ${selected === plan.name ? "border-[#0d5b38]" : "border-[#e0e2e2]"}`} key={plan.name}>{plan.name === "Quarterly" ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0d5b38] px-4 py-1 text-[12px] font-semibold text-white">Best value</span> : null}<h2 className="text-[22px] font-bold">{plan.name}</h2><p className="mt-4 text-[31px] font-bold text-[#0d5b38]">{plan.price}</p><p className="text-[16px] text-[#66717e]">{plan.perMonth}</p><button aria-pressed={selected === plan.name} className={`mt-5 min-h-[52px] w-full rounded-[10px] border-2 border-[#0d5b38] px-4 text-[16px] font-semibold ${profileFocus} ${selected === plan.name ? "bg-[#0d5b38] text-white" : "bg-white text-[#0d5b38]"}`} onClick={() => { setSelected(plan.name); setMessage(""); }} type="button">{selected === plan.name ? `${plan.name} selected` : `Select ${plan.name}`}</button></section>)}
    <button className={primaryButton} onClick={() => setMessage(`Checkout for the ${selected.toLowerCase()} plan is unavailable in this preview. No payment or subscription was created.`)} type="button">Continue to Payment</button>{message ? <p aria-live="polite" className="text-center text-sm text-[#66717e]" role="status">{message}</p> : null}<PreviewNote>Illustrative plans and prices. Confirm current branch rates before payment.</PreviewNote>
  </div></ProfileFrame>;
}
