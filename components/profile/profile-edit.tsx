"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/profile/edit/actions";
import { FormNotice, type NoticeTone } from "@/components/ui/form-notice";
import { ProfileAvatar, ProfileCard, ProfileFrame, ProfileHeading, inputClass, primaryButton, profileFocus } from "@/components/profile/profile-ui";
import type { PractitionerProfile } from "@/lib/profile/types";
import { nigerianStates } from "@/lib/profile/validation";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const initialProfileActionState: ProfileActionState = { fieldErrors: {}, message: "", status: "idle" };

type AvatarNotice = { message: string; tone: NoticeTone } | null;

function readAvatarResponse(value: unknown): { message: string; url?: string } {
  if (!value || typeof value !== "object") return { message: "The photo could not be uploaded. Try again." };
  const record = value as Record<string, unknown>;
  return {
    message: typeof record.message === "string" ? record.message : "The photo could not be uploaded. Try again.",
    url: typeof record.url === "string" ? record.url : undefined,
  };
}

export function ProfileEdit({ profile }: { profile: PractitionerProfile }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialProfileActionState);
  const fieldErrors = state.fieldErrors ?? {};
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [previewUrl, setPreviewUrl] = useState("");
  const [avatarNotice, setAvatarNotice] = useState<AvatarNotice>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!acceptedTypes.has(file.type)) {
      setAvatarNotice({ message: "Choose a JPG, PNG, or WebP image.", tone: "error" });
      event.target.value = "";
      return;
    }
    if (file.size <= 0 || file.size > 2 * 1024 * 1024) {
      setAvatarNotice({ message: "Choose an image smaller than 2 MB.", tone: "error" });
      event.target.value = "";
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const localUrl = URL.createObjectURL(file);
    previewRef.current = localUrl;
    setPreviewUrl(localUrl);
    setUploading(true);
    setAvatarNotice({ message: "Uploading profile photo…", tone: "info" });

    const formData = new FormData();
    formData.set("avatar", file);
    try {
      const response = await fetch("/profile/edit/avatar", { body: formData, method: "POST" });
      const result = readAvatarResponse(await response.json());
      if (!response.ok || !result.url) {
        setAvatarNotice({ message: result.message, tone: "error" });
        return;
      }
      setAvatarUrl(result.url);
      setPreviewUrl("");
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
      setAvatarNotice({ message: result.message, tone: "success" });
      router.refresh();
    } catch {
      setAvatarNotice({ message: "The photo could not be uploaded. Check your connection and try again.", tone: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return <ProfileFrame><ProfileHeading description="Update the information your branch allows you to manage." title="Edit Profile"/><div className="mx-auto max-w-[760px] space-y-4">
    <ProfileCard className="flex flex-col items-center gap-3 text-center">
      {previewUrl ? <Image alt="Selected profile photo preview" className="size-[92px] rounded-[20%] border-2 border-[#0d5b38] object-cover" height={92} src={previewUrl} unoptimized width={92}/> : <ProfileAvatar fullName={profile.fullName} large url={avatarUrl}/>}
      <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={changePhoto} ref={inputRef} type="file"/>
      <button className={`rounded-[10px] bg-[#0d5b38] px-6 py-3 text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${profileFocus}`} disabled={uploading} onClick={() => inputRef.current?.click()} type="button">{uploading ? "Uploading…" : avatarUrl ? "Change Photo" : "Add Photo"}</button>
      <p className="text-[13px] text-[#66717e]">JPG, PNG or WebP. Maximum size 2 MB.</p>
      {avatarNotice ? <FormNotice className="w-full text-left" tone={avatarNotice.tone}>{avatarNotice.message}</FormNotice> : null}
    </ProfileCard>

    <form action={formAction} className="space-y-4" noValidate>
      <ProfileCard title="Personal Information"><div className="space-y-5">
        <div><label className="mb-2 block font-semibold" htmlFor="profile-name">Full Name</label><input aria-describedby={fieldErrors.fullName ? "profile-name-error" : undefined} aria-invalid={Boolean(fieldErrors.fullName)} autoComplete="name" className={`${inputClass} ${fieldErrors.fullName ? "border-[#b91c1c] ring-2 ring-[#b91c1c]/10" : ""}`} defaultValue={profile.fullName} id="profile-name" name="fullName"/>{fieldErrors.fullName ? <p className="auth-error" id="profile-name-error" role="alert">{fieldErrors.fullName}</p> : null}</div>
        <div><label className="mb-2 block font-semibold" htmlFor="profile-email">Email Address</label><input className={inputClass} disabled id="profile-email" value={profile.email}/><p className="mt-1 text-[13px] text-[#66717e]">Your sign-in email cannot be changed from this profile.</p></div>
        <div><label className="mb-2 block font-semibold" htmlFor="profile-scn">Supreme Court Number (SCN)</label><input className={inputClass} disabled id="profile-scn" value={profile.scn}/><p className="mt-1 text-[13px] text-[#66717e]">Contact your branch administrator if this verified identifier is incorrect.</p></div>
        <div><label className="mb-2 block font-semibold" htmlFor="profile-phone">Phone Number</label><input aria-describedby={fieldErrors.phone ? "profile-phone-error" : undefined} aria-invalid={Boolean(fieldErrors.phone)} autoComplete="tel" className={`${inputClass} ${fieldErrors.phone ? "border-[#b91c1c] ring-2 ring-[#b91c1c]/10" : ""}`} defaultValue={profile.phone} id="profile-phone" name="phone" type="tel"/>{fieldErrors.phone ? <p className="auth-error" id="profile-phone-error" role="alert">{fieldErrors.phone}</p> : null}</div>
      </div></ProfileCard>
      <ProfileCard title="Professional Information"><div className="space-y-5">
        <div><label className="mb-2 block font-semibold" htmlFor="profile-branch">Branch Affiliation</label><input className={inputClass} disabled id="profile-branch" value={profile.branchName}/><p className="mt-1 text-[13px] text-[#66717e]">Contact your branch administrator to change your affiliation.</p></div>
        <div><label className="mb-2 block font-semibold" htmlFor="profile-state">Practice State</label><select aria-describedby={fieldErrors.practiceState ? "profile-state-error" : undefined} aria-invalid={Boolean(fieldErrors.practiceState)} className={`${inputClass} ${fieldErrors.practiceState ? "border-[#b91c1c] ring-2 ring-[#b91c1c]/10" : ""}`} defaultValue={profile.practiceState || profile.branchState || ""} id="profile-state" name="practiceState"><option disabled value="">Select a state</option>{nigerianStates.map((stateName) => <option key={stateName} value={stateName}>{stateName}</option>)}</select>{fieldErrors.practiceState ? <p className="auth-error" id="profile-state-error" role="alert">{fieldErrors.practiceState}</p> : <p className="mt-1 text-[13px] text-[#66717e]">This does not change your branch or fee calculation.</p>}</div>
        <div className="space-y-2"><button className={primaryButton} disabled={pending} type="submit">{pending ? "Saving…" : "Save Changes"}</button><button className={`min-h-[52px] w-full rounded-[10px] border border-[#d9dedb] bg-white text-[16px] font-semibold ${profileFocus}`} onClick={() => router.push("/profile")} type="button">Cancel</button></div>
      </div></ProfileCard>
      {state.message ? <FormNotice tone={state.status === "success" ? "success" : "error"}>{state.message}</FormNotice> : null}
    </form>
  </div></ProfileFrame>;
}
