import assert from "node:assert/strict";
import test from "node:test";
import { validateBankDetails } from "./validation.ts";

test("bank details may be left entirely empty", () => {
  assert.deepEqual(validateBankDetails({ accountName: " ", accountNumber: "", bankName: "" }), { errors: {}, bank: null });
});

test("complete bank details are trimmed and accepted", () => {
  const result = validateBankDetails({ accountName: " Ada Okafor ", accountNumber: "0123456789", bankName: " Zenith Bank " });
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.bank, { accountName: "Ada Okafor", accountNumber: "0123456789", bankName: "Zenith Bank" });
});

test("partial bank details are refused", () => {
  const result = validateBankDetails({ accountName: "Ada Okafor", accountNumber: "", bankName: "" });
  assert.equal(result.bank, null);
  assert.ok(result.errors.bankAccountNumber);
  assert.ok(result.errors.bankName);
});

test("account numbers must be ten-digit NUBANs", () => {
  for (const accountNumber of ["012345678", "01234567890", "01234abcde", "0123 456789"]) {
    const result = validateBankDetails({ accountName: "Ada Okafor", accountNumber, bankName: "Zenith Bank" });
    assert.match(result.errors.bankAccountNumber ?? "", /ten-digit NUBAN/, accountNumber);
  }
});
