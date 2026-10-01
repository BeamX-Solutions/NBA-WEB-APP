import assert from "node:assert/strict";
import test from "node:test";
import { accessFor, redirectFor } from "./access.ts";

test("administrators are turned away whatever their membership", () => {
  assert.deepEqual(accessFor({ role: "branch_admin", membership_status: "pending" }), { kind: "administrator" });
  assert.deepEqual(accessFor({ role: "super_admin" }), { kind: "administrator" });
});

test("members are practitioners only once approved", () => {
  assert.deepEqual(accessFor({ role: "branch_member", membership_status: "approved" }), { kind: "practitioner" });
  assert.deepEqual(accessFor({ role: "branch_member", membership_status: "pending" }), { kind: "membership" });
  assert.deepEqual(accessFor({ role: "branch_member", membership_status: "rejected" }), { kind: "membership" });
});

test("an unknown membership status is reported rather than treated as approved", () => {
  assert.deepEqual(accessFor({ role: "branch_member" }), { kind: "unavailable" });
  assert.deepEqual(accessFor({ role: "branch_member", membership_status: "suspended" }), { kind: "unavailable" });
});

test("a missing profile is reported rather than guessed", () => {
  assert.deepEqual(accessFor(null), { kind: "unavailable" });
});

test("administrators are sent to their own page from every page", () => {
  assert.equal(redirectFor({ kind: "administrator" }, "/transactions"), "/administrator-account");
  assert.equal(redirectFor({ kind: "administrator" }, "/"), "/administrator-account");
  assert.equal(redirectFor({ kind: "administrator" }, "/membership"), "/administrator-account");
});

test("an account that could not be confirmed is held at a retry page, never let through", () => {
  assert.equal(redirectFor({ kind: "unavailable" }, "/profile"), "/account-unavailable");
  assert.equal(redirectFor({ kind: "unavailable" }, "/"), "/account-unavailable");
  assert.equal(redirectFor({ kind: "unavailable" }, "/account-unavailable"), null);
});

test("members and practitioners are routed to their own pages and nowhere else", () => {
  assert.equal(redirectFor({ kind: "membership" }, "/"), "/membership");
  assert.equal(redirectFor({ kind: "membership" }, "/account-unavailable"), "/membership");
  assert.equal(redirectFor({ kind: "membership" }, "/membership"), null);
  assert.equal(redirectFor({ kind: "practitioner" }, "/membership"), "/");
  assert.equal(redirectFor({ kind: "practitioner" }, "/account-unavailable"), "/");
  assert.equal(redirectFor({ kind: "practitioner" }, "/certificates"), null);
});
