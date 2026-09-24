"use client";

import Link from "next/link";
import { useState } from "react";
import { DetailRow, PersonGlyph, ProfileIcon, PreviewNote, ProfileCard, ProfileFrame, profileFocus, primaryButton } from "@/components/profile/profile-ui";
import { previewIdentity, profileStorageKey, parsePreviewProfile } from "@/lib/profile/preview-profile";
import { useLocalPreview } from "@/lib/profile/use-local-preview";

const settings = [
  { label: "Edit Profile", icon: "edit", href: "/profile/edit" },
  { label: "Notification Settings", icon: "bell", href: "/profile/notifications" },
  { label: "Security", icon: "shield", href: "/profile/security" },
  { label: "Help & Support", icon: "help", href: "/profile/help" },
] as const;

export function ProfileOverview() {
  const profile = parsePreviewProfile(useLocalPreview(profileStorageKey));
  const [message, setMessage] = useState("");

  return <ProfileFrame navigation><div className="mb-5 flex flex-col items-center text-center"><PersonGlyph large/><h1 className="mt-4 text-[26px] leading-[1.2] font-bold">{profile.fullName}</h1><p className="mt-2 text-[15px] text-[#66717e]">{previewIdentity.scn} - {previewIdentity.branch}</p><PreviewNote>Sample practitioner profile · local preview</PreviewNote></div>
    <div className="grid gap-4 min-[800px]:grid-cols-2 min-[800px]:items-start">
      <ProfileCard icon={<ProfileIcon kind="briefcase"/>} title="Professional Details"><dl><DetailRow label="Full Name" value={profile.fullName}/><DetailRow label="Supreme Court Number" value={previewIdentity.scn}/><DetailRow label="Branch" value={previewIdentity.branch}/><DetailRow label="State of Practice" value={profile.practiceState}/><DetailRow label="Email" value={previewIdentity.email}/></dl></ProfileCard>
      <div className="grid gap-4"><ProfileCard icon={<ProfileIcon kind="medal"/>} title="Subscription Status"><div className="mb-5 flex items-center justify-between gap-3"><strong className="text-[17px]">Yearly (Branch rate)</strong><span className="rounded-full bg-[#e8f8ef] px-3 py-2 text-[13px] font-semibold text-[#17704a]">Sample active</span></div><dl><DetailRow label="Amount Paid" value="₦162,000"/><DetailRow label="Expiry Date" value="31/08/2027"/></dl><Link className={`${primaryButton} mt-5`} href="/profile/plans">Renew Now</Link><p className="mt-2 text-center text-xs text-[#69737d]">Illustrative status. No entitlement is granted.</p></ProfileCard>
      <ProfileCard icon={<ProfileIcon kind="settings"/>} title="Account Settings"><div className="divide-y divide-[#eceeee]">{settings.map((item) => <Link className={`flex min-h-[58px] items-center gap-4 text-[16px] ${profileFocus}`} href={item.href} key={item.href}><span aria-hidden="true" className="w-5 text-center text-[20px] text-[#66717e]"><ProfileIcon kind={item.icon}/></span><span className="flex-1">{item.label}</span><span aria-hidden="true" className="text-[24px] text-[#88919a]">›</span></Link>)}</div></ProfileCard>
      <button className={`min-h-[54px] w-full rounded-[10px] border-2 border-[#be4834] bg-white text-[17px] font-semibold text-[#b74330] ${profileFocus}`} onClick={() => setMessage("No authenticated session exists in this preview, so there is nothing to log out of.")} type="button">Log Out</button>{message ? <p aria-live="polite" className="text-center text-sm text-[#66717e]" role="status">{message}</p> : null}</div>
    </div>
  </ProfileFrame>;
}
