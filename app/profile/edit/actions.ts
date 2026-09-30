"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateBankDetails, validateProfileUpdate, type ProfileFieldErrors } from "@/lib/profile/validation";

export type ProfileActionState = {
  fieldErrors: ProfileFieldErrors;
  message: string;
  status: "error" | "idle" | "success";
};

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function updateProfileAction(_previous: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const fullName = field(formData, "fullName");
  const phone = field(formData, "phone");
  const practiceState = field(formData, "practiceState");
  const bankResult = validateBankDetails({
    accountName: field(formData, "bankAccountName"),
    accountNumber: field(formData, "bankAccountNumber"),
    bankName: field(formData, "bankName"),
  });
  const fieldErrors = { ...validateProfileUpdate({ fullName, phone, practiceState }), ...bankResult.errors };
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, message: "Review the highlighted fields.", status: "error" };

  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return { fieldErrors: {}, message: "Your session expired. Log in again before saving.", status: "error" };

  // Only columns the practitioner may change. Role, branch and SCN are refused by protect_profile_columns.
  const { bank } = bankResult;
  const { data, error } = await client
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      practice_state: practiceState,
      bank_account_name: bank?.accountName ?? null,
      bank_account_number: bank?.accountNumber ?? null,
      bank_name: bank?.bankName ?? null,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { fieldErrors: {}, message: "Your profile could not be saved. Refresh the page and try again.", status: "error" };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/");
  return { fieldErrors: {}, message: "Profile changes saved.", status: "success" };
}
