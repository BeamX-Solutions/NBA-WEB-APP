export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type ProfileFieldErrors = Partial<Record<"fullName" | "phone" | "practiceState" | "bankAccountName" | "bankAccountNumber" | "bankName", string>>;

export type BankDetails = { accountName: string; accountNumber: string; bankName: string };

const phonePattern = /^\+?[0-9][0-9\s()-]{6,19}$/;
const nubanPattern = /^[0-9]{10}$/;
const bankTextLimit = 120;

export function validateProfileUpdate(values: { fullName: string; phone: string; practiceState: string }): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!phonePattern.test(values.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!nigerianStates.includes(values.practiceState as (typeof nigerianStates)[number])) errors.practiceState = "Select a valid practice state.";
  return errors;
}

/**
 * All three or none: a partial account is one the branch cannot pay into.
 * The number must be the ten-digit NUBAN the database constraint requires.
 */
export function validateBankDetails(values: BankDetails): { errors: ProfileFieldErrors; bank: BankDetails | null } {
  const bank = { accountName: values.accountName.trim(), accountNumber: values.accountNumber.trim(), bankName: values.bankName.trim() };
  const given = [bank.accountName, bank.accountNumber, bank.bankName].filter(Boolean).length;
  if (given === 0) return { errors: {}, bank: null };

  const errors: ProfileFieldErrors = {};
  const missing = "Enter the account name, account number and bank, or leave all three empty.";
  if (!bank.accountName) errors.bankAccountName = missing;
  else if (bank.accountName.length > bankTextLimit) errors.bankAccountName = `Account name must be ${bankTextLimit} characters or fewer.`;
  if (!bank.accountNumber) errors.bankAccountNumber = missing;
  else if (!nubanPattern.test(bank.accountNumber)) errors.bankAccountNumber = "The account number must be the ten-digit NUBAN.";
  if (!bank.bankName) errors.bankName = missing;
  else if (bank.bankName.length > bankTextLimit) errors.bankName = `Bank name must be ${bankTextLimit} characters or fewer.`;
  return Object.keys(errors).length > 0 ? { errors, bank: null } : { errors, bank };
}

