"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/mobile/badge";
import { Button, ButtonLink } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { ConfirmDialog } from "@/components/mobile/confirm-dialog";
import { DetailList, DetailRow, Screen, SectionTitle, SettingsRow } from "@/components/mobile/screen";
import { Notice } from "@/components/mobile/states";
import { ProfileAvatar } from "@/components/profile/avatar";
import { friendlyAuthError } from "@/lib/auth/errors";
import { formatNaira } from "@/lib/fees/legal-fees";
import { formatProfileDate, labelEnum } from "@/lib/profile/format";
import type { PractitionerProfile, PractitionerSubscription } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";

function SubscriptionCard({ subscription }: { subscription: PractitionerSubscription | null }) {
  const active = subscription?.isCurrent ? subscription : null;
  return <Card>
    <SectionTitle icon="workspace-premium" underline>Subscription Status</SectionTitle>
    {active ? <>
      <div className="mb-2 flex items-center justify-between gap-3"><p className="text-body-lg font-bold text-text">{labelEnum(active.plan)}{active.rateType === "branch_discounted" ? " (Branch rate)" : ""}</p><Badge label="Active"/></div>
      <DetailList>
        {/* Stored in kobo, like every money column. */}
        <DetailRow label="Amount Paid" value={formatNaira(BigInt(Math.round(active.amount)))}/>
        <DetailRow label="Expiry Date" value={formatProfileDate(active.expiresAt)}/>
      </DetailList>
    </> : <p className="text-body leading-[22px] text-text-muted">You do not have an active subscription. Fee calculations remain free. A subscription is required to generate invoices and certificates.</p>}
    <div className="mt-4"><ButtonLink href="/profile/plans">{active ? "Renew Now" : "Choose a Plan"}</ButtonLink></div>
  </Card>;
}

/** mobile (tabs)/profile. From 800px the details sit beside subscription and settings. */
export function ProfileOverview({ profile, subscription }: { profile: PractitionerProfile; subscription: PractitionerSubscription | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");

  async function signOut() {
    setSigningOut(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) { setMessage(friendlyAuthError(error, "logout")); setConfirming(false); return; }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setMessage(friendlyAuthError(error, "logout"));
      setConfirming(false);
    } finally {
      setSigningOut(false);
    }
  }

  return <Screen wide>
    <div className="mb-4 flex flex-col items-center text-center">
      <div className="mb-3"><ProfileAvatar url={profile.avatarUrl}/></div>
      <h1 className="m-0 text-heading font-bold text-text">{profile.fullName || "Practitioner"}</h1>
      <p className="mt-1 text-label text-text-muted">{profile.scn || "No SCN recorded"}{profile.branchName ? ` - ${profile.branchName}` : ""}</p>
    </div>
    <div className="grid gap-4 min-[800px]:grid-cols-2 min-[800px]:items-start">
      <Card>
        <SectionTitle icon="work-outline" underline>Professional Details</SectionTitle>
        <DetailList>
          <DetailRow label="Full Name" value={profile.fullName || "Not set"}/>
          <DetailRow label="Supreme Court Number" value={profile.scn || "Not set"}/>
          <DetailRow label="Branch" value={profile.branchName || "No branch affiliation"}/>
          <DetailRow label="State of Practice" value={profile.practiceState || "Not set"}/>
          <DetailRow label="Email" value={profile.email}/>
          <DetailRow label="Phone" value={profile.phone || "Not set"}/>
        </DetailList>
      </Card>
      <div className="grid gap-4">
        <SubscriptionCard subscription={subscription}/>
        <Card>
          <SectionTitle icon="settings" underline>Account Settings</SectionTitle>
          <SettingsRow href="/profile/edit" icon="edit" label="Edit Profile"/>
          <SettingsRow href="/profile/notifications" icon="notifications-none" label="Notification Settings"/>
          <SettingsRow href="/profile/security" icon="security" label="Security"/>
          <SettingsRow href="/profile/help" icon="help-outline" label="Help & Support"/>
        </Card>
        <div className="mt-2"><Button onClick={() => setConfirming(true)} variant="danger">Log Out</Button></div>
        {message ? <Notice tone="error">{message}</Notice> : null}
      </div>
    </div>
    {confirming ? <ConfirmDialog body="You will need your email and password to sign in again. Any certificates already issued stay available once you return." busy={signingOut} cancelLabel="Stay signed in" confirmLabel="Log out" destructive onCancel={() => setConfirming(false)} onConfirm={signOut} title="Log out?"/> : null}
  </Screen>;
}
