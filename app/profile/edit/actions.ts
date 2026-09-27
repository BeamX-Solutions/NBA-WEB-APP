"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateProfileUpdate, type ProfileFieldErrors } from "@/lib/profile/validation";

export type ProfileActionState = {
  fieldErrors: ProfileFieldErrors;
  message: string;
  status: "error" | "idle" | "success";
};

export async function updateProfileAction(_previous: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const practiceState = String(formData.get("practiceState") ?? "");
  const fieldErrors = validateProfileUpdate({ fullName, phone, practiceState });
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, message: "Review the highlighted fields.", status: "error" };

  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return { fieldErrors: {}, message: "Your session expired. Log in again before saving.", status: "error" };

  const { data, error } = await client
    .from("profiles")
    .update({ full_name: fullName, phone, practice_state: practiceState })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { fieldErrors: {}, message: "Your profile could not be saved. Refresh the page and try again.", status: "error" };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { fieldErrors: {}, message: "Profile changes saved.", status: "success" };
}
