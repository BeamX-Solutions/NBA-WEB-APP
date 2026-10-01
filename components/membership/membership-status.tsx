"use client";

import { useActionState } from "react";
import { resubmitMembershipAction, type ResubmitActionState } from "@/app/membership/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GateBody, GateScreen } from "@/components/membership/gate-screen";
import { Button, ButtonLink } from "@/components/mobile/button";
import { SelectField, TextField } from "@/components/mobile/field";
import { PRODUCT_NAME } from "@/lib/branding";
import type { SignupBranch } from "@/lib/auth/branches";

export type MembershipDetails = {
  branches: SignupBranch[];
  fullName: string;
  phone: string;
  rejectionReason: string | null;
  scn: string;
  status: "pending" | "rejected";
};

const initialState: ResubmitActionState = { fieldErrors: {}, message: "", status: "idle" };

function ResubmitForm({ details }: { details: MembershipDetails }) {
  const [state, formAction, pending] = useActionState(resubmitMembershipAction, initialState);
  const errors = state.fieldErrors;
  const branchOptions = [{ value: "", label: "Keep my current branch" }, ...details.branches.map((branch) => ({ value: branch.branch_code, label: branch.name }))];
  return <form action={formAction} className="mt-4 w-full text-left" noValidate>
    <TextField autoCapitalize="words" autoComplete="name" defaultValue={details.fullName} error={errors.fullName} id="membership-name" label="Full Name" name="fullName"/>
    <TextField autoCapitalize="characters" autoComplete="off" defaultValue={details.scn} error={errors.scn} id="membership-scn" label="Supreme Court Number (SCN)" name="scn"/>
    <TextField autoComplete="tel" defaultValue={details.phone} error={errors.phone} id="membership-phone" label="Phone Number" name="phone" type="tel"/>
    <SelectField defaultValue="" error={errors.branchCode} id="membership-branch" label="Branch (only if changing branch)" name="branchCode" options={branchOptions} placeholder="Keep my current branch"/>
    {state.message ? <p className="mb-3 text-label text-danger" role="alert">{state.message}</p> : null}
    <Button loading={pending} type="submit">Send to my branch again</Button>
  </form>;
}

/** mobile components/ui/MembershipPending. */
export function MembershipStatus({ details }: { details: MembershipDetails }) {
  if (details.status === "rejected") {
    return <GateScreen icon="error-outline" title="Your branch could not approve you">
      <div className="mt-4 rounded-input bg-danger-surface p-3 text-left"><p className="text-caption font-bold tracking-[0.5px] text-danger uppercase">Reason given</p><p className="mt-1 text-body leading-[21px] text-danger">{details.rejectionReason ?? "No reason was recorded."}</p></div>
      <GateBody>Correct your details below and send them back to your branch. Leave the branch unchanged unless you registered with the wrong branch.</GateBody>
      <ResubmitForm details={details}/>
      <div className="mt-3"><SignOutButton/></div>
    </GateScreen>;
  }

  return <GateScreen icon="hourglass-top" title="Waiting for your branch">
    <GateBody>Your account has been created. An administrator of your branch has to confirm you are one of its members before you can use {PRODUCT_NAME}.</GateBody>
    <GateBody>You will be able to continue as soon as they approve you. Check back here, or sign in again later.</GateBody>
    {/* A full page load, so the proxy re-reads the membership and moves an approved member on. */}
    <div className="mt-6"><ButtonLink external href="/membership">Check again</ButtonLink></div>
    <div className="mt-3"><SignOutButton/></div>
  </GateScreen>;
}
