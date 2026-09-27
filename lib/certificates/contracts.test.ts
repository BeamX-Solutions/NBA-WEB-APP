import assert from "node:assert/strict";
import test from "node:test";
import { certificatePdfLocation, decodeRbinSegment, normalizeRbin, parseCertificate, parseVerification, verificationPath } from "./contracts.ts";

const id = "b18c2bad-bfcb-40d5-b7d0-1c6ea836a3d6";
const row = {
  id, transaction_id: "96e8931a-3578-46b0-8109-620f2f1baefd", certificate_number: "NBA-CC-2026-0001",
  issued_at: "2026-09-04T22:54:27Z", revoked_at: null, revocation_reason: null, pdf_url: null,
  transactions: { status: "verified", rbin: "NBA/ANAOCHA/0002/2026", document_type: "deed_of_assignment", consideration: "3500000000", parties: "Private parties", branches: { name: "Anaocha", chairman_name: null } },
};
const identity = { name: "Test Practitioner", scn: "SCN/TEST" };

test("issued records retain actual branch, identity, kobo precision and legacy certificate numbers", () => {
  const parsed = parseCertificate(row, identity)!;
  assert.equal(parsed.id, id);
  assert.equal(parsed.consideration, "₦35,000,000");
  assert.equal(parsed.branch, "Anaocha");
  assert.equal(parsed.chairman, "Unavailable");
  assert.equal(parsed.practitioner, identity.name);
  assert.equal(parsed.certificateNumber, "NBA-CC-2026-0001");
  assert.equal(parsed.pdfUrl, null);
  assert.equal(parsed.revoked, false);
  assert.equal(parsed.issuedAt, "04/09/2026");
});

test("malformed and unverified certificates cannot become issued UI records", () => {
  for (const value of [null, { ...row, id: "sample-0001" }, { ...row, issued_at: "bad" }, { ...row, revoked_at: "bad" }, { ...row, transactions: null }, { ...row, transactions: { ...row.transactions, status: "pending_verification" } }, { ...row, transactions: { ...row.transactions, consideration: Number.MAX_SAFE_INTEGER + 1 } }, { ...row, transactions: { ...row.transactions, document_type: "unknown" } }]) assert.equal(parseCertificate(value, identity), null);
  const revoked = parseCertificate({ ...row, revoked_at: "2026-09-05T00:00:00Z", revocation_reason: "Withdrawn" }, identity)!;
  assert.equal(revoked.revoked, true);
  assert.equal(revoked.revocationReason, "Withdrawn");
});

test("RBIN URLs preserve slash identifiers and never double-decode input", () => {
  assert.equal(normalizeRbin(" nba/anaocha/0002/2026 "), "NBA/ANAOCHA/0002/2026");
  assert.equal(normalizeRbin("NBA-2026-0001"), "NBA-2026-0001");
  for (const input of ["", "NBA%2FSECRET", "NBA\nBAD", "<script>", "a".repeat(201)]) assert.equal(normalizeRbin(input), null);
  assert.equal(decodeRbinSegment("NBA%2FANAOCHA%2F0002%2F2026"), row.transactions.rbin);
  assert.equal(decodeRbinSegment(row.transactions.rbin), row.transactions.rbin);
  assert.equal(decodeRbinSegment("NBA%252FSECRET"), null);
  assert.equal(decodeRbinSegment("NBA%ZZ"), null);
  assert.equal(verificationPath(row.transactions.rbin), "/verify/NBA%2FANAOCHA%2F0002%2F2026");
});

test("verification projection cannot include private particulars even if the response contains them", () => {
  const publicRow = { found: true, rbin: row.transactions.rbin, certificate_number: row.certificate_number, issued_at: row.issued_at, document_type: row.transactions.document_type, practitioner_name: identity.name, scn: identity.scn, branch_name: "Anaocha", revoked: true, revocation_reason: "Withdrawn", parties: "Private parties", consideration: 3500000000, email: "private@example.com", proof_url: "private" };
  const parsed = parseVerification(publicRow)!;
  assert.equal(parsed.revoked, true);
  for (const key of ["parties", "consideration", "email", "proof_url"]) assert.equal(Object.hasOwn(parsed, key), false);
  assert.equal(parseVerification({ ...publicRow, found: false }), null);
  assert.equal(parseVerification({ ...publicRow, revoked: "false" }), null);
});

test("PDF reads accept only the configured project Storage paths", () => {
  const project = "https://project.supabase.co";
  for (const kind of ["public", "authenticated", "sign"]) assert.deepEqual(certificatePdfLocation(`${project}/storage/v1/object/${kind}/certificates/user/document.pdf?token=unused`, project), { bucket: "certificates", path: "user/document.pdf" });
  for (const value of [null, "path/to/document.pdf", "javascript:alert(1)", "https://evil.example/document.pdf", `${project}/arbitrary/file.pdf`, `${project}/storage/v1/object/public/certificates/a%2F..%2Fb`, `${project}/storage/v1/object/public/certificates/a%5Cb`, `${project}/storage/v1/object/public/bucket%2Fother/file`]) assert.equal(certificatePdfLocation(value, project), null);
});
