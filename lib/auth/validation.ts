export type RegisterField = "branch" | "confirmation" | "email" | "fullName" | "password" | "phone" | "scn";
export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s()-]{6,19}$/;
const scnPattern = /^[A-Za-z0-9][A-Za-z0-9/ -]{2,39}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | null {
  if (!value) return "Enter your email address.";
  return emailPattern.test(value) ? null : "Enter a valid email address.";
}

export function validatePassword(value: string): string | null {
  if (!value) return "Enter your password.";
  return value.length >= 8 ? null : "Use at least 8 characters.";
}

export function safeInternalPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://internal.invalid");
    return url.origin === "https://internal.invalid" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export function validateRegistration(values: {
  branchSelected: boolean;
  confirmation: string;
  email: string;
  fullName: string;
  password: string;
  phone: string;
  scn: string;
}): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (!phonePattern.test(values.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!scnPattern.test(values.scn.trim())) errors.scn = "Enter a valid Supreme Court Number.";
  if (!values.branchSelected) errors.branch = "Select your NBA branch.";
  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;
  if (!values.confirmation) errors.confirmation = "Confirm your password.";
  else if (values.password !== values.confirmation) errors.confirmation = "The passwords do not match.";
  return errors;
}

