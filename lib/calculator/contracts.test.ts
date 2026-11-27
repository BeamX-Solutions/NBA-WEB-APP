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
  assert.equal(databaseDocumentTypes["irrevocable-power-of-attorney"], "power_of_attorney");
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

test("invoice validation rejects invalid fields, asking a Power of Attorney for its agreed fee", () => {
  const result = validateInvoiceInput({
    amount: "0",
    documentId: "irrevocable-power-of-attorney",
    parties: "",
    propertyDescription: "",
  });
  assert.equal(result.data, null);
  assert.match(result.fieldErrors.amount ?? "", /agreed fee/);
  assert.ok(result.fieldErrors.parties);
  assert.ok(result.fieldErrors.propertyDescription);
  assert.equal(result.fieldErrors.document, undefined);
});

test("a Power of Attorney validates on its agreed fee, leaving the branch's acceptance to the database", () => {
  const result = validateInvoiceInput({
    amount: "500,000",
    documentId: "irrevocable-power-of-attorney",
    parties: "Chinedu Okafor to Adeola Properties Ltd",
    propertyDescription: "Plot 14, Block C, Ikota Layout, Lekki",
  });
  assert.deepEqual(result.fieldErrors, {});
  assert.equal(result.data?.feeAgreed, true);
  assert.equal(result.data?.amountKobo, 50_000_000n);
  assert.equal(result.data?.databaseDocumentType, "power_of_attorney");
  assert.equal(validateInvoiceInput({ amount: "15,000,000", documentId: "deed-of-assignment", parties: "A to B", propertyDescription: "Plot 1" }).data?.feeAgreed, false);
});

test("database failures are mapped to safe user messages", () => {
  assert.match(safeInvoiceErrorMessage({ message: "NBA Example is not currently active" }), /branch is not currently active/i);
  assert.match(safeInvoiceErrorMessage({ message: "active subscription required" }), /active subscription/i);
  assert.match(safeInvoiceErrorMessage({ message: "Add your bank details in Edit Profile before generating an invoice. Your branch sends your fee to that account." }), /Edit Profile/);
  assert.match(safeInvoiceErrorMessage({ message: "Your branch has not approved your membership yet, so you cannot generate an invoice." }), /not approved your membership/);
  assert.match(safeInvoiceErrorMessage({ message: "The branch fee does not match the professional fee" }), /Recalculate/);
  assert.match(safeInvoiceErrorMessage({ message: "Administrator accounts cannot submit transactions. Use a practitioner account." }), /practitioner account/);
  assert.match(safeInvoiceErrorMessage({ message: "NBA Awka Branch does not accept Power of Attorney invoices. Its fee is agreed with the client under paragraph 2 of the Order." }), /does not accept Power of Attorney invoices/);
  assert.match(safeInvoiceErrorMessage({ message: "Enter the fee agreed with the client" }), /fee agreed with the client/);
  assert.match(safeInvoiceErrorMessage({ message: "The agreed fee is larger than the calculator accepts." }), /fee agreed with the client/);
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
