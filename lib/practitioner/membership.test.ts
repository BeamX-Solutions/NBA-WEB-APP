import assert from "node:assert/strict";
import test from "node:test";
import { safeResubmissionMessage, validateResubmission } from "./membership.ts";

test("a valid resubmission is normalised", () => {
  const result = validateResubmission({ branchCode: " anaocha ", fullName: " Ada Okafor ", phone: "+234 800 000 0000", scn: " SCN/2015/041287 " });
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, { branchCode: "ANAOCHA", fullName: "Ada Okafor", phone: "+234 800 000 0000", scn: "SCN/2015/041287" });
});

test("keeping the current branch sends no branch code", () => {
  assert.equal(validateResubmission({ branchCode: "", fullName: "Ada Okafor", phone: "08000000000", scn: "SCN123" }).data?.branchCode, null);
});

test("invalid details are refused field by field", () => {
  const result = validateResubmission({ branchCode: "no spaces allowed", fullName: "A", phone: "abc", scn: "" });
  assert.equal(result.data, null);
  assert.deepEqual(Object.keys(result.errors).sort(), ["branchCode", "fullName", "phone", "scn"]);
});

test("database refusals become safe, actionable messages", () => {
  assert.match(safeResubmissionMessage({ code: "23505", message: "duplicate key value violates unique constraint" }), /already registered/);
  assert.match(safeResubmissionMessage({ code: "P0001", message: "Unknown branch code XYZ" }), /not recognised/);
  assert.match(safeResubmissionMessage({ code: "P0001", message: "That branch is not yet registered on this service." }), /not yet registered/);
  assert.doesNotMatch(safeResubmissionMessage({ message: "relation secret_table does not exist" }), /secret_table/);
});
