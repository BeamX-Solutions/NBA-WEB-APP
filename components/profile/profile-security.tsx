"use client";

import { useState, type FormEvent } from "react";
import { DetailRow, ProfileCard, ProfileIcon, ProfileFrame, ProfileHeading, inputClass, primaryButton } from "@/components/profile/profile-ui";
import { previewIdentity } from "@/lib/profile/preview-profile";

export function ProfileSecurity() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) { setMessage("Use at least 8 characters for the new password."); return; }
    if (password !== confirmation) { setMessage("The passwords do not match."); return; }
    setPassword(""); setConfirmation("");
    setMessage("Password changes are unavailable without an authenticated account. No password was saved.");
  }
  return <ProfileFrame><ProfileHeading description="Manage how you sign in to your account." title="Security"/><div className="mx-auto max-w-[760px] space-y-4"><ProfileCard icon={<ProfileIcon kind="lock"/>} title="Change password"><form className="space-y-5" onSubmit={submit}><div><label className="mb-2 block font-semibold" htmlFor="new-password">New Password</label><input autoComplete="new-password" className={inputClass} id="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required type="password" value={password}/></div><div><label className="mb-2 block font-semibold" htmlFor="confirm-password">Confirm New Password</label><input autoComplete="new-password" className={inputClass} id="confirm-password" onChange={(event) => setConfirmation(event.target.value)} placeholder="Re-enter the new password" required type="password" value={confirmation}/></div><button className={primaryButton} type="submit">Update Password</button>{message ? <p aria-live="polite" className="text-sm text-[#66717e]" role="status">{message}</p> : null}</form></ProfileCard><ProfileCard icon={<ProfileIcon kind="account"/>} title="Account"><dl><DetailRow label="Email" value={`${previewIdentity.email} (sample)`}/><DetailRow label="Last signed in" value="Unavailable in this preview"/></dl></ProfileCard><p className="text-center text-[14px] leading-[1.5] text-[#66717e]">Your Supreme Court Number and branch cannot be changed here. They identify you on certificates that carry legal weight, so a branch administrator has to make those changes.</p></div></ProfileFrame>;
}
