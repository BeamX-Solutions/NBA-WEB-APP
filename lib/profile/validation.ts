export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type ProfileFieldErrors = Partial<Record<"fullName" | "phone" | "practiceState", string>>;

const phonePattern = /^\+?[0-9][0-9\s()-]{6,19}$/;

export function validateProfileUpdate(values: { fullName: string; phone: string; practiceState: string }): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!phonePattern.test(values.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!nigerianStates.includes(values.practiceState as (typeof nigerianStates)[number])) errors.practiceState = "Select a valid practice state.";
  return errors;
}

