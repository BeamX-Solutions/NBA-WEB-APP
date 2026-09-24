"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PersonGlyph, PreviewNote, ProfileCard, ProfileFrame, ProfileHeading, inputClass, primaryButton, profileFocus } from "@/components/profile/profile-ui";
import { previewIdentity, profileStorageKey, parsePreviewProfile, type PreviewProfile } from "@/lib/profile/preview-profile";
import { useLocalPreview } from "@/lib/profile/use-local-preview";

const states = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProfileEdit() {
  const saved = useLocalPreview(profileStorageKey);
  return <ProfileEditForm initialProfile={parsePreviewProfile(saved)} key={saved ?? "default"}/>;
}

function ProfileEditForm({ initialProfile }: { initialProfile: PreviewProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState<PreviewProfile>(initialProfile);
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef("");
  useEffect(() => () => { if (photoRef.current) URL.revokeObjectURL(photoRef.current); }, []);

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!acceptedTypes.has(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage("Choose a JPG, PNG, or WebP image smaller than 2 MB.");
      event.target.value = "";
      return;
    }
    if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    const url = URL.createObjectURL(file);
    photoRef.current = url;
    setPhotoUrl(url);
    setMessage("Photo preview loaded. It is not uploaded or saved.");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = profile.fullName.trim();
    const phone = profile.phone.trim();
    if (fullName.length < 2 || phone.length < 7 || !states.includes(profile.practiceState)) {
      setMessage("Enter a full name, valid phone number, and practice state.");
      return;
    }
    try {
      window.localStorage.setItem(profileStorageKey, JSON.stringify({ fullName, phone, practiceState: profile.practiceState }));
      setMessage("Profile preview saved on this device. No official record was changed.");
    } catch {
      setMessage("This browser could not save the profile preview.");
    }
  }

  return <ProfileFrame><ProfileHeading description="Update your official information." title="Edit Profile"/><form className="mx-auto max-w-[760px] space-y-4" onSubmit={save}>
    <ProfileCard className="flex flex-col items-center gap-3 text-center"><div className="relative">{photoUrl ? <Image alt="Selected profile photo preview" className="size-[92px] rounded-[20%] border-2 border-[#0d5b38] object-cover" height={92} src={photoUrl} unoptimized width={92}/> : <PersonGlyph large/>}</div><input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={changePhoto} ref={inputRef} type="file"/><button className={`rounded-[10px] bg-[#0d5b38] px-6 py-3 text-[16px] font-semibold text-white ${profileFocus}`} onClick={() => inputRef.current?.click()} type="button">Add Photo</button><p className="text-[13px] text-[#66717e]">JPG, PNG or WebP. Max size of 2MB.</p></ProfileCard>
    <ProfileCard title="Personal Information"><div className="space-y-5"><div><label className="mb-2 block font-semibold" htmlFor="profile-name">Full Name</label><input autoComplete="name" className={inputClass} id="profile-name" onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} required value={profile.fullName}/></div><div><label className="mb-2 block font-semibold" htmlFor="profile-scn">Supreme Court Number (SCN)</label><input className={inputClass} disabled id="profile-scn" value={previewIdentity.scn}/><p className="mt-1 text-[13px] text-[#66717e]">SCN cannot be changed once verified.</p></div><div><label className="mb-2 block font-semibold" htmlFor="profile-phone">Phone Number</label><input autoComplete="tel" className={inputClass} id="profile-phone" onChange={(event) => setProfile({ ...profile, phone: event.target.value })} required type="tel" value={profile.phone}/></div></div></ProfileCard>
    <ProfileCard title="Professional Information"><div className="space-y-5"><div><label className="mb-2 block font-semibold" htmlFor="profile-branch">Branch Affiliation</label><input className={inputClass} disabled id="profile-branch" value={previewIdentity.branch}/><p className="mt-1 text-[13px] text-[#66717e]">Contact your branch administrator to change your affiliation.</p></div><div><label className="mb-2 block font-semibold" htmlFor="profile-state">Practice State</label><select className={inputClass} id="profile-state" onChange={(event) => setProfile({ ...profile, practiceState: event.target.value })} value={profile.practiceState}>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select><p className="mt-1 text-[13px] text-[#66717e]">Recorded on your profile for branch administration. It does not affect the fee.</p></div><div className="space-y-2"><button className={primaryButton} type="submit">Save Changes</button><button className={`min-h-[52px] w-full rounded-[10px] border border-[#d9dedb] bg-white text-[16px] font-semibold ${profileFocus}`} onClick={() => router.push("/profile")} type="button">Cancel</button></div></div></ProfileCard>
    {message ? <p aria-live="polite" className="text-center text-sm text-[#66717e]" role="status">{message}</p> : null}<PreviewNote>Changes here are a local preview and do not update an official profile.</PreviewNote>
  </form></ProfileFrame>;
}
