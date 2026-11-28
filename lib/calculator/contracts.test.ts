import assert from "node:assert/strict";
import test from "node:test";
import { databaseDocumentTypes, safeInvoiceErrorMessage, validateInvoiceInput } from "./contracts.ts";
import { DOCUMENT_TYPES } from "../fees/legal-fees.ts";

test("every calculator document maps to a deployed database enum value", () => {
  assert.deepEqual(
    DOCUMENT_TYPES.map((document) => document.id).sort(),
    Object.keys(databaseDocumentTypes).sort(),
  );
  assert.equal(databaseDocumentTypes["mortgage-release"], "deed_of_release");
  assert.equal(databaseDocumentTypes["irrevocable-power-of-attorney"], "irrevocable_power_of_attorney");
  assert.equal(databaseDocumentTypes["power-of-attorney"], "power_of_attorney");
  assert.equal(databaseDocumentTypes["deed-of-assignment-ipoa"], "deed_of_assignment_ipoa");
  assert.equal(databaseDocumentTypes["deed-of-transfer-ipoa"], "deed_of_transfer_ipoa");
  assert.equal(databaseDocumentTypes["deed-of-conveyance-ipoa"], "deed_of_conveyance_ipoa");
});

test("invoice validation returns normalized trusted inputs", () => {
  const result = validateInvoiceInput({
    amount: "15,000,000",
    documentId: "deed-of-assignment",
    parties: "  Chinedu Okafor to Adeola Properties Ltd  ",
    propertyDescription: "  Plot 14, Block C, Ikota Layout, Lekki  ",
  });
  assert.deepEqual(result.fieldErrors, {});
  assert.equal(result.data?.amountKobo, 1_500_000_000n);
  assert.equal(result.data?.databaseDocumentType, "deed_of_assignment");
  assert.equal(result.data?.parties, "Chinedu Okafor to Adeola Properties Ltd");
  assert.equal(result.data?.propertyDescription, "Plot 14, Block C, Ikota Layout, Lekki");
});

test("invoice validation requires a description of the property of at most 500 characters", () => {
  const input = { amount: "15,000,000", documentId: "deed-of-assignment", parties: "A to B" };
  assert.equal(validateInvoiceInput({ ...input, propertyDescription: "   " }).fieldErrors.propertyDescription, "Describe the property.");
  assert.match(validateInvoiceInput({ ...input, propertyDescription: "x".repeat(501) }).fieldErrors.propertyDescription ?? "", /500 characters/);
  assert.deepEqual(validateInvoiceInput({ ...input, propertyDescription: "x".repeat(500) }).fieldErrors, {});
});

test("invoice validation rejects invalid fields and a discretionary Power of Attorney", () => {
  const result = validateInvoiceInput({
    amount: "0",
    documentId: "power-of-attorney",
    parties: "",
    propertyDescription: "",
  });
  assert.equal(result.data, null);
  assert.ok(result.fieldErrors.amount);
  assert.ok(result.fieldErrors.parties);
  assert.ok(result.fieldErrors.propertyDescription);
  assert.match(result.fieldErrors.document ?? "", /not covered by Scale 4/);
});

test("database failures are mapped to safe user messages", () => {
  assert.match(safeInvoiceErrorMessage({ message: "NBA Example is not currently active" }), /branch is not currently active/i);
  assert.match(safeInvoiceErrorMessage({ message: "active subscription required" }), /active subscription/i);
  assert.match(safeInvoiceErrorMessage({ message: "Add your bank details in Edit Profile before generating an invoice. Your branch sends your fee to that account." }), /Edit Profile/);
  assert.match(safeInvoiceErrorMessage({ message: "Your branch has not approved your membership yet, so you cannot generate an invoice." }), /not approved your membership/);
  assert.match(safeInvoiceErrorMessage({ message: "The branch fee does not match the professional fee" }), /Recalculate/);
  assert.match(safeInvoiceErrorMessage({ message: "Administrator accounts cannot submit transactions. Use a practitioner account." }), /practitioner account/);
  assert.doesNotMatch(safeInvoiceErrorMessage({ message: "relation secret_table does not exist" }), /secret_table/i);
});

test("a deed of transfer validates and maps to deed_of_transfer", () => {
  const result = validateInvoiceInput({
    amount: "60,000,000",
    documentId: "deed-of-transfer",
    parties: "Chinedu Okafor to Adeola Properties Ltd",
    propertyDescription: "Plot 14, Block C, Ikota Layout, Lekki",
  });
  assert.deepEqual(result.fieldErrors, {});
  assert.equal(result.data?.databaseDocumentType, "deed_of_transfer");
  assert.equal(result.data?.document.label, "Deed of Transfer");
});

test("an Irrevocable Power of Attorney and the combined documents validate for an invoice", () => {
  for (const [documentId, type] of [["irrevocable-power-of-attorney", "irrevocable_power_of_attorney"], ["deed-of-assignment-ipoa", "deed_of_assignment_ipoa"], ["deed-of-transfer-ipoa", "deed_of_transfer_ipoa"], ["deed-of-conveyance-ipoa", "deed_of_conveyance_ipoa"]] as const) {
    const result = validateInvoiceInput({ amount: "60,000,000", documentId, parties: "Donor to Donee", propertyDescription: "Plot 9, Awka" });
    assert.deepEqual(result.fieldErrors, {}, documentId);
    assert.equal(result.data?.databaseDocumentType, type);
  }
});
