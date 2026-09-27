"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormNotice } from "@/components/ui/form-notice";
import { DetailRow, ProfileAvatar, ProfileCard, ProfileFrame, ProfileIcon, profileFocus, primaryButton } from "@/components/profile/profile-ui";
import { friendlyAuthError } from "@/lib/auth/errors";
import { formatNaira, formatProfileDate, labelEnum } from "@/lib/profile/format";
import type { PractitionerProfile, PractitionerSubscription } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";

const settings = [
  { label: "Edit Profile", icon: "edit", href: "/profile/edit" },
  { label: "Notification Settings", icon: "bell", href: "/profile/notifications" },
  { label: "Security", icon: "shield", href: "/profile/security" },
  { label: "Help & Support", icon: "help", href: "/profile/help" },
] as const;

function SubscriptionCard({ subscription }: { subscription: PractitionerSubscription | null }) {
  if (!subscription) {
    return <ProfileCard icon={<ProfileIcon kind="medal"/>} title="Subscription Status"><p className="text-[15px] leading-[1.55] text-[#66717e]">No subscription record is available for this account. Contact your branch before creating a transaction.</p><Link className={`${primaryButton} mt-5`} href="/profile/plans">View subscription details</Link></ProfileCard>;
  }

  const status = subscription.isCurrent ? "Active" : subscription.status === "active" ? "Expired" : labelEnum(subscription.status);
  return <ProfileCard icon={<ProfileIcon kind="medal"/>} title="Subscription Status"><div className="mb-5 flex items-center justify-between gap-3"><strong className="text-[17px]">{labelEnum(subscription.plan)} ({labelEnum(subscription.rateType)} rate)</strong><span className={`rounded-full px-3 py-2 text-[13px] font-semibold ${subscription.isCurrent ? "bg-[#e8f8ef] text-[#17704a]" : "bg-[#fff2ef] text-[#a23d2d]"}`}>{status}</span></div><dl><DetailRow label="Amount Paid" value={formatNaira(subscription.amount)}/><DetailRow label="Starts" value={formatProfileDate(subscription.startsAt)}/><DetailRow label="Expires" value={formatProfileDate(subscription.expiresAt)}/></dl><Link className={`${primaryButton} mt-5`} href="/profile/plans">View subscription details</Link></ProfileCard>;
}
export function ProfileOverview({ profile, subscription }: { profile: PractitionerProfile; subscription: PractitionerSubscription | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setMessage(friendlyAuthError(error, "logout"));
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setMessage(friendlyAuthError(error, "logout"));
    } finally {
      setSigningOut(false);
    }
  }

  return <ProfileFrame navigation><div className="mb-5 flex flex-col items-center text-center"><ProfileAvatar fullName={profile.fullName} large url={profile.avatarUrl}/><h1 className="mt-4 text-[26px] leading-[1.2] font-bold">{profile.fullName}</h1><p className="mt-2 text-[15px] text-[#66717e]">{profile.scn} · {profile.branchName}</p></div>
    <div className="grid gap-4 min-[800px]:grid-cols-2 min-[800px]:items-start">
      <ProfileCard icon={<ProfileIcon kind="briefcase"/>} title="Professional Details"><dl><DetailRow label="Full Name" value={profile.fullName}/><DetailRow label="Supreme Court Number" value={profile.scn}/><DetailRow label="Branch" value={profile.branchName}/><DetailRow label="State of Practice" value={profile.practiceState || "Not provided"}/><DetailRow label="Email" value={profile.email}/><DetailRow label="Phone" value={profile.phone || "Not provided"}/></dl></ProfileCard>
      <div className="grid gap-4"><SubscriptionCard subscription={subscription}/>
      <ProfileCard icon={<ProfileIcon kind="settings"/>} title="Account Settings"><div className="divide-y divide-[#eceeee]">{settings.map((item) => <Link className={`flex min-h-[58px] items-center gap-4 text-[16px] ${profileFocus}`} href={item.href} key={item.href}><span aria-hidden="true" className="w-5 text-center text-[20px] text-[#66717e]"><ProfileIcon kind={item.icon}/></span><span className="flex-1">{item.label}</span><span aria-hidden="true" className="text-[24px] text-[#88919a]">›</span></Link>)}</div></ProfileCard>
      <button className={`min-h-[54px] w-full rounded-[10px] border-2 border-[#be4834] bg-white text-[17px] font-semibold text-[#b74330] ${profileFocus}`} disabled={signingOut} onClick={signOut} type="button">{signingOut ? "Logging out…" : "Log Out"}</button>{message ? <FormNotice tone="error">{message}</FormNotice> : null}</div>
    </div>
  </ProfileFrame>;
}
