"use server";

import { friendlyAuthError } from "@/lib/auth/errors";
import { validatePassword } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

type SecurityField = "confirmation" | "currentPassword" | "password";

export type SecurityActionState = {
  fieldErrors: Partial<Record<SecurityField, string>>;
  message: string;
  status: "error" | "idle" | "success";
};

export async function changePasswordAction(_previous: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const fieldErrors: SecurityActionState["fieldErrors"] = {};
  if (!currentPassword) fieldErrors.currentPassword = "Enter your current password.";
  const passwordError = validatePassword(password);
  if (passwordError) fieldErrors.password = passwordError;
  if (!confirmation) fieldErrors.confirmation = "Confirm your new password.";
  else if (password !== confirmation) fieldErrors.confirmation = "The passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, message: "Review the highlighted fields.", status: "error" };

  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return { fieldErrors: {}, message: "Your session expired. Log in again before changing your password.", status: "error" };

  const { error } = await client.auth.updateUser({ current_password: currentPassword, password });
  if (error) return { fieldErrors: {}, message: friendlyAuthError(error, "change-password"), status: "error" };
  return { fieldErrors: {}, message: "Password updated successfully.", status: "success" };
}
