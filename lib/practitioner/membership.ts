import { isValidPhone, isValidScn } from "../auth/validation.ts";

export type MembershipField = "branchCode" | "fullName" | "phone" | "scn";
export type MembershipFieldErrors = Partial<Record<MembershipField, string>>;

export type Resubmission = { branchCode: string | null; fullName: string; phone: string; scn: string };

const branchCodePattern = /^[A-Z0-9_-]{2,32}$/;

/** A rejected member corrects their details and, optionally, names a different branch. */
export function validateResubmission(values: Resubmission): { errors: MembershipFieldErrors; data: Resubmission | null } {
  const data: Resubmission = {
    branchCode: values.branchCode?.trim().toUpperCase() || null,
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    scn: values.scn.trim(),
  };
  const errors: MembershipFieldErrors = {};
  if (data.fullName.length < 2) errors.fullName = "Enter your full name.";
  if (!isValidScn(data.scn)) errors.scn = "Enter a valid Supreme Court Number.";
  if (!isValidPhone(data.phone)) errors.phone = "Enter a valid phone number.";
  if (data.branchCode !== null && !branchCodePattern.test(data.branchCode)) errors.branchCode = "Select a branch from the list.";
  return Object.keys(errors).length > 0 ? { errors, data: null } : { errors, data };
}

/** Maps resubmit_membership refusals to copy the member can act on, never raw database text. */
export function safeResubmissionMessage(error: { code?: string; message?: string }): string {
  const message = (error.message ?? "").toLowerCase();
  if (error.code === "23505") return "That Supreme Court Number is already registered to another account.";
  if (message.includes("unknown branch code")) return "That branch was not recognised. Choose it again from the list.";
  if (message.includes("not yet registered")) return "That branch is not yet registered on this service. Ask your branch secretariat to contact the Association.";
  if (message.includes("only a rejected request")) return "Your request is already with your branch.";
  if (message.includes("signed in")) return "Your session expired. Log in again before resubmitting.";
  return "Your details could not be sent to your branch. Please try again.";
}
