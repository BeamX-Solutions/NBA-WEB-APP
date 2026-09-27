"use client";

import { useState } from "react";
import { FormNotice, type NoticeTone } from "@/components/ui/form-notice";
import { ProfileCard, ProfileIcon, ProfileFrame, ProfileHeading, profileFocus } from "@/components/profile/profile-ui";
import { useLocalPreview, writeLocalPreview } from "@/lib/profile/use-local-preview";

const notificationItems = [
  { key: "payment", title: "Payment verification", description: "When your branch verifies or rejects proof of payment you have submitted." },
  { key: "certificate", title: "Certificate issued", description: "When a Certificate of Compliance and RBIN are issued to you." },
  { key: "subscription", title: "Subscription reminders", description: "Before your subscription expires, so calculations do not stop unexpectedly." },
  { key: "fees", title: "Fee scale changes", description: "When the Remuneration Order is amended and the calculator is updated." },
  { key: "branch", title: "Branch announcements", description: "General notices from your branch that are not about your own transactions." },
] as const;
type NotificationKey = typeof notificationItems[number]["key"];
type Preferences = Record<NotificationKey, boolean>;
const defaults: Preferences = { payment: true, certificate: true, subscription: true, fees: true, branch: false };
const storageKey = "nba-notification-preferences-v1";

function parsePreferences(raw: string | null): Preferences {
  if (!raw) return defaults;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return defaults;
    const values = saved as Partial<Preferences>;
    return { payment: values.payment === true, certificate: values.certificate === true, subscription: values.subscription === true, fees: values.fees === true, branch: values.branch === true };
  } catch { return defaults; }
}

export function ProfileNotifications() {
  const preferences = parsePreferences(useLocalPreview(storageKey));
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);

  function toggle(key: NotificationKey) {
    const next = { ...preferences, [key]: !preferences[key] };
    try { writeLocalPreview(storageKey, JSON.stringify(next)); setNotice({ message: "Preference saved on this device.", tone: "success" }); }
    catch { setNotice({ message: "This browser could not save the preference.", tone: "error" }); }
  }

  return <ProfileFrame><ProfileHeading description="Choose what you are told about, and when." title="Notification Settings"/><div className="mx-auto max-w-[760px]"><ProfileCard icon={<ProfileIcon kind="bell"/>} title="Notify me about"><div className="divide-y divide-[#eceeee]">{notificationItems.map((item) => <div className="flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1" key={item.key}><div><h3 className="text-[16px] font-semibold">{item.title}</h3><p className="mt-2 text-[14px] leading-[1.5] text-[#66717e]">{item.description}</p></div><button aria-checked={preferences[item.key]} aria-label={item.title} className={`relative mt-1 h-[30px] w-[60px] shrink-0 rounded-full border-2 transition-colors ${profileFocus} ${preferences[item.key] ? "border-[#0d5b38] bg-[#0d5b38]" : "border-[#c7c9cc] bg-[#c7c9cc]"}`} onClick={() => toggle(item.key)} role="switch" type="button"><span className={`absolute top-[2px] size-[22px] rounded-full bg-white transition-[left] ${preferences[item.key] ? "left-[32px]" : "left-[2px]"}`}/></button></div>)}</div></ProfileCard><p className="mt-5 text-center text-[14px] leading-[1.5] text-[#66717e]">Push delivery is not enabled yet, so these preferences are saved on this device only. They will apply once notifications are switched on.</p>{notice ? <FormNotice className="mt-3" tone={notice.tone}>{notice.message}</FormNotice> : null}</div></ProfileFrame>;
}
