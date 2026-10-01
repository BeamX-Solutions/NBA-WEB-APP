"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/profile/edit/actions";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { SelectField, TextField } from "@/components/mobile/field";
import { Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { Notice, type NoticeTone } from "@/components/mobile/states";
import { ProfileAvatar } from "@/components/profile/avatar";
import type { PractitionerProfile } from "@/lib/profile/types";
import { nigerianStates } from "@/lib/profile/validation";
import { useOnline } from "@/lib/use-online";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const initialState: ProfileActionState = { fieldErrors: {}, message: "", status: "idle" };
const stateOptions = nigerianStates.map((state) => ({ value: state, label: state }));

function readAvatarResponse(value: unknown): { message: string; url?: string } {
  if (!value || typeof value !== "object") return { message: "The photo could not be uploaded. Try again." };
  const record = value as Record<string, unknown>;
  return { message: typeof record.message === "string" ? record.message : "The photo could not be uploaded. Try again.", url: typeof record.url === "string" ? record.url : undefined };
}

/** mobile profile/edit: photo, personal, bank and professional details. */
export function ProfileEdit({ profile }: { profile: PractitionerProfile }) {
  const router = useRouter();
  const online = useOnline();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoNotice, setPhotoNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [accountNumber, setAccountNumber] = useState(profile.bankAccountNumber);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!acceptedTypes.has(file.type)) { setPhotoNotice({ message: "Choose a JPG, PNG, or WebP image.", tone: "error" }); event.target.value = ""; return; }
    if (file.size <= 0 || file.size > 2 * 1024 * 1024) { setPhotoNotice({ message: "Choose an image smaller than 2 MB.", tone: "error" }); event.target.value = ""; return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(file);
    setPreviewUrl(previewRef.current);
    setUploading(true);
    setPhotoNotice(null);
    const formData = new FormData();
    formData.set("avatar", file);
    try {
      const response = await fetch("/profile/edit/avatar", { body: formData, method: "POST" });
      const result = readAvatarResponse(await response.json());
      if (!response.ok || !result.url) { setPhotoNotice({ message: result.message, tone: "error" }); return; }
      setAvatarUrl(result.url);
      setPhotoNotice({ message: result.message, tone: "success" });
      router.refresh();
    } catch {
      setPhotoNotice({ message: "The photo could not be uploaded. Check your connection and try again.", tone: "error" });
    } finally {
      setPreviewUrl("");
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
      setUploading(false);
      event.target.value = "";
    }
  }

  return <Screen>
    <ScreenHeading subtitle="Update your official information." title="Edit Profile"/>
    <Card className="mb-4 flex flex-col items-center text-center">
      <div className="mb-3"><ProfileAvatar size={96} url={previewUrl || avatarUrl}/></div>
      <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={changePhoto} ref={inputRef} tabIndex={-1} type="file"/>
      <div><Button className="w-auto! px-6" disabled={!online} loading={uploading} onClick={() => inputRef.current?.click()}>{avatarUrl ? "Change Photo" : "Add Photo"}</Button></div>
      {photoNotice ? <Notice className="mt-3 w-full text-left" tone={photoNotice.tone}>{photoNotice.message}</Notice> : null}
      <p className="mt-2 text-caption text-text-muted">JPG, PNG or WebP. Max size of 2MB.</p>
    </Card>

    <form action={formAction} noValidate>
      <Card className="mb-4">
        <SectionTitle underline>Personal Information</SectionTitle>
        <TextField autoCapitalize="words" autoComplete="name" defaultValue={profile.fullName} error={fieldErrors.fullName} id="profile-name" label="Full Name" name="fullName"/>
        <TextField hint="SCN cannot be changed once verified." id="profile-scn" label="Supreme Court Number (SCN)" locked readOnly value={profile.scn}/>
        <TextField hint="Your sign-in email cannot be changed from this profile." id="profile-email" label="Email Address" locked readOnly value={profile.email}/>
        <TextField autoComplete="tel" defaultValue={profile.phone} error={fieldErrors.phone} id="profile-phone" label="Phone Number" name="phone" placeholder="+234 800 000 0000" type="tel"/>
      </Card>

      <Card className="mb-4">
        <SectionTitle underline>Bank Details</SectionTitle>
        <p className="mb-3 text-caption leading-[17px] text-text-muted">Your branch pays your fee into this account, after deducting the 2% branch fee.</p>
        <TextField autoCapitalize="words" autoComplete="off" defaultValue={profile.bankAccountName} error={fieldErrors.bankAccountName} id="profile-bank-account-name" label="Account Name" maxLength={120} name="bankAccountName"/>
        <TextField error={fieldErrors.bankAccountNumber} id="profile-bank-account-number" inputMode="numeric" label="Account Number" maxLength={10} name="bankAccountNumber" onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))} placeholder="10 digit NUBAN" value={accountNumber}/>
        <TextField autoCapitalize="words" defaultValue={profile.bankName} error={fieldErrors.bankName} id="profile-bank-name" label="Bank" maxLength={120} name="bankName" placeholder="e.g. Zenith Bank"/>
      </Card>

      <Card className="mb-4">
        <SectionTitle underline>Professional Information</SectionTitle>
        <TextField hint="Contact your branch administrator to change your affiliation." id="profile-branch" label="Branch Affiliation" locked readOnly value={profile.branchName}/>
        <SelectField defaultValue={profile.practiceState || profile.branchState || ""} error={fieldErrors.practiceState} hint="Recorded on your profile for branch administration. It does not affect the fee." id="profile-state" label="Practice State" name="practiceState" options={stateOptions} placeholder="Select a State"/>
        {state.message ? <Notice className="mb-4" tone={state.status === "success" ? "success" : "error"}>{state.message}</Notice> : null}
        <Button disabled={!online} loading={pending} type="submit">{online ? "Save Changes" : "Offline: reconnect to save"}</Button>
        <Button className="mt-2 border-border! text-text!" onClick={() => router.push("/profile")} variant="outline">Cancel</Button>
      </Card>
    </form>
  </Screen>;
}
