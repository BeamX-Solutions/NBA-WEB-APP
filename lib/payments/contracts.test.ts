import assert from "node:assert/strict";
import test from "node:test";
import { parsePaymentRow, payInStatus, payoutStatus } from "./contracts.ts";

const row = {
  id: "c78a74c3-1324-42bd-8a86-6287e1d22bd7",
  invoice_number: "TXN-00012-DOA",
  document_type: "deed_of_assignment",
  status: "verified",
  due_to_practitioner: "147000000",
  remitted_at: null,
  created_at: "2026-09-27T14:00:00Z",
  payouts: null,
};

test("pay-in names each stage of the client paying the branch", () => {
  assert.equal(payInStatus("awaiting_payment")?.label, "Awaiting payment");
  assert.equal(payInStatus("pending_verification")?.label, "Being verified");
  assert.equal(payInStatus("verified")?.label, "Received");
  assert.equal(payInStatus("rejected")?.label, "Rejected");
  assert.equal(payInStatus("constructor"), null);
});

test("payout is pending once verified, confirmed in green once the branch records it", () => {
  assert.deepEqual(payoutStatus("verified", 1n, null), { label: "Pending", tone: "warning" });
  assert.deepEqual(payoutStatus("verified", 1n, "2026-10-20T10:00:00Z"), { label: "Confirmed", tone: "success" });
  assert.equal(payoutStatus("pending_verification", 1n, null), null);
  assert.equal(payoutStatus("verified", 0n, null), null);
});

test("a row carries the share, both statuses and whether there is a receipt", () => {
  const pending = parsePaymentRow(row)!;
  assert.equal(pending.amount, "₦1,470,000");
  assert.equal(pending.payIn.label, "Received");
  assert.equal(pending.payout?.label, "Pending");
  assert.equal(pending.hasReceipt, false);
  assert.equal(pending.shareKobo, 147000000n);

  const paid = parsePaymentRow({ ...row, remitted_at: "2026-10-20T10:00:00Z", payouts: { receipt_path: "b/u/r.pdf" } })!;
  assert.equal(paid.payout?.label, "Confirmed");
  assert.equal(paid.hasReceipt, true);

  // Paid one invoice at a time, before receipts existed.
  const legacy = parsePaymentRow({ ...row, remitted_at: "2026-09-29T09:00:00Z" })!;
  assert.equal(legacy.payout?.label, "Confirmed");
  assert.equal(legacy.hasReceipt, false);
});

test("an unreadable row is refused rather than shown half filled", () => {
  assert.equal(parsePaymentRow({ ...row, id: "nope" }), null);
  assert.equal(parsePaymentRow({ ...row, status: "unknown" }), null);
  assert.equal(parsePaymentRow({ ...row, document_type: "unknown" }), null);
  assert.equal(parsePaymentRow({ ...row, due_to_practitioner: "-1" }), null);
});
