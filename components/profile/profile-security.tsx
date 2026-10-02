"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type SecurityActionState } from "@/app/(practitioner)/profile/security/actions";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { TextField } from "@/components/mobile/field";
import { DetailList, DetailRow, Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";

const initialState: SecurityActionState = { fieldErrors: {}, message: "", status: "idle" };

/**
 * mobile settings/security. The web also asks for the current password before changing it, which
 * mobile does not; that check is kept.
 */
export function ProfileSecurity({ account }: { account: { email: string; lastSignedIn: string } }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);

  return <Screen>
    <ScreenHeading subtitle="Manage how you sign in to your account." title="Security"/>
    <Card>
      <SectionTitle icon="lock-outline" underline>Change password</SectionTitle>
      <form action={formAction} noValidate ref={formRef}>
        <TextField autoComplete="current-password" error={fieldErrors.currentPassword} id="currentPassword" label="Current Password" name="currentPassword" type="password"/>
        <TextField autoComplete="new-password" error={fieldErrors.password} id="password" label="New Password" name="password" placeholder="At least 8 characters" type="password"/>
        <TextField autoComplete="new-password" error={fieldErrors.confirmation} id="confirmation" label="Confirm New Password" name="confirmation" placeholder="Re-enter the new password" type="password"/>
        {state.message ? <p className={`mb-3 text-label ${state.status === "success" ? "text-primary" : "text-danger"}`} role={state.status === "success" ? "status" : "alert"}>{state.message}</p> : null}
        <Button loading={pending} type="submit">Update Password</Button>
      </form>
    </Card>
    <Card className="mt-4">
      <SectionTitle icon="badge" underline>Account</SectionTitle>
      <DetailList><DetailRow label="Email" value={account.email}/><DetailRow label="Last signed in" value={account.lastSignedIn}/></DetailList>
    </Card>
    <p className="mt-4 text-center text-caption leading-[17px] text-text-muted">Your Supreme Court Number and branch cannot be changed here. They identify you on certificates that carry legal weight, so a branch administrator has to make those changes.</p>
  </Screen>;
}
