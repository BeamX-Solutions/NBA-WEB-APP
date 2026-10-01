import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitProof, money, parseTransaction } from "./contracts.ts";
import { submitProof, validateProofContent, type ProofSubmissionPorts } from "./proof.ts";

const row = { id: "c78a74c3-1324-42bd-8a86-6287e1d22bd7", status: "awaiting_payment", invoice_number: "TXN-00012-DOA", document_type: "deed_of_assignment", consideration: "1500000000", amount_payable: "150000000", branch_fee: "3000000", due_to_practitioner: "147000000", remitted_at: null, remitted_to: null, remittance_reference: null, created_at: "2026-09-27T14:00:00Z", parties: "Client One to Client Two" };
const identity = { name: "Test Practitioner", scn: "SCN/TEST" };

test("live records carry the client-pays-through-branch split and use owned identity", () => {
  const result = parseTransaction(row, identity)!;
  assert.equal(result.amountPayable, "₦1,500,000");
  assert.equal(result.branchFee, "₦30,000");
  assert.equal(result.dueToPractitioner, "₦1,470,000");
  assert.equal(result.hasDueToPractitioner, true);
  assert.equal(result.remittance, null);
  assert.equal(result.practitioner, identity.name);
  assert.equal(result.scn, identity.scn);
  assert.equal(result.status, "awaiting");
  assert.equal(result.invoiceNumber, row.invoice_number);
  assert.equal(result.documentType, "Deed of Assignment");
  assert.equal(parseTransaction({ ...row, document_type: "unknown" }, identity), null);
  assert.equal(parseTransaction({ ...row, status: "unknown" }, identity), null);
  assert.equal(parseTransaction({ ...row, status: "constructor" }, identity), null);
  assert.equal(parseTransaction({ ...row, document_type: "power_of_attorney" }, identity)?.documentType, "Irrevocable Power of Attorney");
});

test("a recorded remittance is shown only when complete", () => {
  const remitted = parseTransaction({ ...row, status: "verified", remitted_at: "2026-09-29T09:00:00Z", remitted_to: "Ada Okafor, 0123456789, Zenith Bank", remittance_reference: "FT123" }, identity)!;
  assert.deepEqual(remitted.remittance, { remittedOn: "29 September 2026", account: "Ada Okafor, 0123456789, Zenith Bank", reference: "FT123" });
  assert.equal(parseTransaction({ ...row, remitted_at: "2026-09-29T09:00:00Z" }, identity)!.remittance, null);
  assert.equal(parseTransaction({ ...row, due_to_practitioner: "0" }, identity)!.hasDueToPractitioner, false);
});

test("unsafe database money is never rounded or treated as a payment amount", () => {
  assert.equal(money(Number.MAX_SAFE_INTEGER + 1), null);
  assert.equal(money("30000.5"), null);
  assert.equal(money("9007199254740993"), "₦90,071,992,547,409.93");
  assert.equal(money(-1), null);
});

test("proof eligibility freezes pending and verified records", () => {
  assert.ok(canSubmitProof("awaiting_payment"));
  assert.ok(canSubmitProof("rejected"));
  for (const status of ["pending_verification", "verified", "unknown", null]) assert.equal(canSubmitProof(status), false);
});

test("proof validation checks MIME, matching extension, and file signature", async () => {
  assert.equal(await validateProofContent(new File(["%PDF-1.7\n"], "proof.pdf", { type: "application/pdf" })), null);
  assert.match(await validateProofContent(new File(["%PDF-1.7"], "proof.png", { type: "application/pdf" })) ?? "", /extension/);
  assert.match(await validateProofContent(new File(["not a pdf"], "proof.pdf", { type: "application/pdf" })) ?? "", /contents/);
  assert.equal(await validateProofContent(new File([new Uint8Array([137,80,78,71,13,10,26,10])], "proof.png", { type: "image/png" })), null);
  assert.match(await validateProofContent(new File([], "proof.pdf", { type: "application/pdf" })) ?? "", /not empty/);
  assert.match(await validateProofContent(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "proof.pdf", { type: "application/pdf" })) ?? "", /10 MB/);
});

function ports(overrides: Partial<ProofSubmissionPorts> = {}) {
  const calls: string[] = [];
  const adapter: ProofSubmissionPorts = {
    upload: async () => { calls.push("upload"); return true; },
    submit: async () => { calls.push("submit"); return { updated: true, error: false }; },
    read: async () => { calls.push("read"); return { status: "awaiting_payment", proofPath: null }; },
    removeUnused: async () => { calls.push("cleanup"); },
    ...overrides,
  };
  return { adapter, calls };
}
const initial = { status: "awaiting_payment", proofPath: null };

test("frozen transactions never reach Storage and rejected transactions can resubmit", async () => {
  const frozen = ports();
  assert.equal((await submitProof({ status: "verified", proofPath: "old" }, "new", frozen.adapter)).success, false);
  assert.deepEqual(frozen.calls, []);
  const rejected = ports();
  assert.equal((await submitProof({ status: "rejected", proofPath: "old" }, "new", rejected.adapter)).success, true);
  assert.deepEqual(rejected.calls, ["upload", "submit"]);
});

test("a failed upload never submits or claims success", async () => {
  const failure = ports({ upload: async () => false });
  assert.equal((await submitProof(initial, "new", failure.adapter)).success, false);
  assert.deepEqual(failure.calls, []);
});

test("a lost submission response can be confirmed from persisted pending state", async () => {
  const uncertain = ports({ submit: async () => ({ updated: false, error: true }), read: async () => ({ status: "pending_verification", proofPath: "new" }) });
  assert.equal((await submitProof(initial, "new", uncertain.adapter)).success, true);
  assert.equal(uncertain.calls.includes("cleanup"), false);
});

test("an unknown submission outcome never deletes a possibly committing proof", async () => {
  const uncertain = ports({ submit: async () => ({ updated: false, error: true }) });
  assert.equal((await submitProof(initial, "new", uncertain.adapter)).success, false);
  assert.equal(uncertain.calls.includes("cleanup"), false);
});

test("a definite lost race cleans up only this request's unused object", async () => {
  const race = ports({ submit: async () => ({ updated: false, error: false }), read: async () => ({ status: "pending_verification", proofPath: "another-request" }) });
  assert.equal((await submitProof(initial, "new", race.adapter)).success, false);
  assert.ok(race.calls.includes("cleanup"));
});
