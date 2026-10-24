import assert from "node:assert/strict";
import test from "node:test";
import { canRenew, renewalOpensAt } from "./renewal.ts";

const now = new Date("2026-10-25T10:00:00Z");

test("renewal opens 7 days before expiry", () => {
  assert.equal(renewalOpensAt("2027-01-25T00:00:00Z")?.toISOString(), "2027-01-18T00:00:00.000Z");
});

test("a subscription just bought is not offered renewal", () => {
  assert.equal(canRenew("2027-01-25T00:00:00Z", now), false);
});

test("one ending within 7 days is", () => {
  assert.equal(canRenew("2026-10-30T00:00:00Z", now), true);
  assert.equal(canRenew("2026-11-01T10:00:00Z", now), true);
  assert.equal(canRenew("2026-11-01T10:00:01Z", now), false);
});

test("an unreadable date offers renewal rather than hiding it", () => {
  assert.equal(renewalOpensAt("not a date"), null);
  assert.equal(canRenew("not a date", now), true);
});
