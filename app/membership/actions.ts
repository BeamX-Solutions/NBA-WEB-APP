"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeResubmissionMessage, validateResubmission, type MembershipFieldErrors } from "@/lib/practitioner/membership";

export type ResubmitActionState = {
  fieldErrors: MembershipFieldErrors;
  message: string;
  status: "error" | "idle";
};

export async function resubmitMembershipAction(_previous: ResubmitActionState, formData: FormData): Promise<ResubmitActionState> {
  const validation = validateResubmission({
    branchCode: String(formData.get("branchCode") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    scn: String(formData.get("scn") ?? ""),
  });
  if (!validation.data) return { fieldErrors: validation.errors, message: "Review the highlighted details.", status: "error" };

  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return { fieldErrors: {}, message: "Your session expired. Log in again before resubmitting.", status: "error" };

  // Name, phone and SCN are corrected directly; protect_profile_columns allows the SCN only before approval.
  const { fullName, phone, scn, branchCode } = validation.data;
  const update = await client.from("profiles").update({ full_name: fullName, phone, scn }).eq("id", user.id).select("id").maybeSingle();
  if (update.error || !update.data) return { fieldErrors: {}, message: safeResubmissionMessage(update.error ?? {}), status: "error" };

  // The branch is the one detail only resubmit_membership may change, checked as signup checks it.
  const { error } = await client.rpc("resubmit_membership", { p_branch_code: branchCode });
  if (error) return { fieldErrors: {}, message: safeResubmissionMessage(error), status: "error" };

  revalidatePath("/membership");
  return { fieldErrors: {}, message: "", status: "idle" };
}
