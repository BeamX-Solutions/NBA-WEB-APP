"use client";

import { useState } from "react";
import { Card } from "@/components/mobile/card";
import { Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { Notice, type NoticeTone } from "@/components/mobile/states";
import { useLocalPreview, writeLocalPreview } from "@/lib/profile/use-local-preview";

const preferences = [
  { key: "payment", title: "Payment verification", description: "When your branch verifies or rejects proof of payment you have submitted." },
  { key: "certificate", title: "Certificate issued", description: "When a Certificate of Compliance and RBIN are issued to you." },
  { key: "subscription", title: "Subscription reminders", description: "Before your subscription expires, so calculations do not stop unexpectedly." },
  { key: "fees", title: "Fee scale changes", description: "When the Remuneration Order is amended and the calculator is updated." },
  { key: "branch", title: "Branch announcements", description: "General notices from your branch that are not about your own transactions." },
] as const;
type PreferenceKey = typeof preferences[number]["key"];
type Preferences = Record<PreferenceKey, boolean>;
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

/** The platform switch mobile renders: green track when on, grey when off. */
function Switch({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return <button aria-checked={checked} aria-label={label} className={`relative h-[31px] w-[51px] shrink-0 rounded-full border-0 transition-colors ${checked ? "bg-primary" : "bg-border-strong"}`} onClick={onToggle} role="switch" type="button"><span className={`absolute top-[2px] size-[27px] rounded-full bg-surface shadow transition-[left] ${checked ? "left-[22px]" : "left-[2px]"}`}/></button>;
}

/** mobile settings/notifications. Preferences are saved on this device only, as on mobile. */
export function ProfileNotifications() {
  const current = parsePreferences(useLocalPreview(storageKey));
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);

  function toggle(key: PreferenceKey) {
    try { writeLocalPreview(storageKey, JSON.stringify({ ...current, [key]: !current[key] })); setNotice(null); }
    catch { setNotice({ message: "This browser could not save the preference.", tone: "error" }); }
  }

  return <Screen>
    <ScreenHeading subtitle="Choose what you are told about, and when." title="Notification Settings"/>
    <Card>
      <SectionTitle icon="notifications-none" underline>Notify me about</SectionTitle>
      {preferences.map((preference) => <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0" key={preference.key}>
        <div className="flex-1"><p className="text-body font-semibold text-text">{preference.title}</p><p className="mt-1 text-caption leading-[17px] text-text-muted">{preference.description}</p></div>
        <Switch checked={current[preference.key]} label={preference.title} onToggle={() => toggle(preference.key)}/>
      </div>)}
    </Card>
    {notice ? <Notice className="mt-3" tone={notice.tone}>{notice.message}</Notice> : null}
    <p className="mt-4 text-center text-caption leading-[17px] text-text-muted">Push delivery is not enabled yet, so these preferences are saved on this device only. They will apply once notifications are switched on.</p>
  </Screen>;
}
