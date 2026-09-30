import assert from "node:assert/strict";
import test from "node:test";
import { invoiceShareText, parseInvoice } from "./invoice.ts";

const identity = { name: "Test Practitioner", scn: "SCN/TEST" };
const row = {
  id: "c78a74c3-1324-42bd-8a86-6287e1d22bd7", invoice_number: "TXN-00012-DOA", status: "awaiting_payment", document_type: "deed_of_assignment",
  parties: "Client One to Client Two", amount_payable: "550000000", branch_fee: "11000000", due_to_practitioner: "539000000", created_at: "2026-09-29T14:00:00Z",
  branches: { name: "NBA Anaocha Branch", account_name: "NBA Anaocha Branch", account_number: "0123456789", bank_name: "Zenith Bank" },
};

test("an invoice carries the remuneration, split and the drawing branch's account", () => {
  const invoice = parseInvoice(row, identity)!;
  assert.equal(invoice.amountPayable, "₦5,500,000");
  assert.equal(invoice.branchFee, "₦110,000");
  assert.equal(invoice.dueToPractitioner, "₦5,390,000");
  assert.equal(invoice.issuedOn, "29 September 2026");
  assert.equal(invoice.canSubmitProof, true);
  assert.deepEqual(invoice.branch, { name: "NBA Anaocha Branch", accountName: "NBA Anaocha Branch", accountNumber: "0123456789", bankName: "Zenith Bank" });
});

test("incomplete branch bank details are treated as unpublished", () => {
  const invoice = parseInvoice({ ...row, branches: { ...row.branches, bank_name: null } }, identity)!;
  assert.deepEqual(invoice.branch, { name: "NBA Anaocha Branch", accountName: null, accountNumber: null, bankName: null });
});

test("malformed rows are refused rather than shown as payable", () => {
  for (const value of [null, { ...row, id: "x" }, { ...row, amount_payable: "1.5" }, { ...row, branches: null }, { ...row, document_type: "unknown" }]) {
    assert.equal(parseInvoice(value, identity), null);
  }
});

test("the share text is the client's payment instruction", () => {
  assert.equal(invoiceShareText(parseInvoice(row, identity)!), "Invoice TXN-00012-DOA: please pay ₦5,500,000 to NBA Anaocha Branch, account 0123456789, Zenith Bank. Quote the reference.");
});
