import assert from "node:assert/strict";
import test from "node:test";
import { isPlanId, parseCheckout, parseConfirmation, referenceFrom } from "./contracts.ts";

test("only the plans on sale are plan ids", () => {
  assert.equal(isPlanId("quarterly"), true);
  assert.equal(isPlanId("weekly"), false);
  assert.equal(isPlanId(undefined), false);
});

test("a checkout must send the practitioner to Paystack", () => {
  assert.deepEqual(parseCheckout({ authorizationUrl: "https://checkout.paystack.com/abc", reference: "NBA-1" }), {
    authorizationUrl: "https://checkout.paystack.com/abc",
    reference: "NBA-1",
  });
  assert.equal(parseCheckout({ authorizationUrl: "https://evil.example/abc", reference: "NBA-1" }), null);
  assert.equal(parseCheckout({ authorizationUrl: "not a url", reference: "NBA-1" }), null);
  assert.equal(parseCheckout({ reference: "NBA-1" }), null);
});

test("a confirmation is read only in the shapes the function sends", () => {
  assert.deepEqual(parseConfirmation({ status: "active", expiresAt: "2027-01-25T10:00:00Z" }), {
    status: "active",
    expiresAt: "2027-01-25T10:00:00Z",
  });
  assert.equal(parseConfirmation({ status: "active" }), null);
  assert.deepEqual(parseConfirmation({ status: "pending" }), { status: "pending" });
  assert.deepEqual(parseConfirmation({ status: "failed" }), { status: "failed" });
  assert.equal(parseConfirmation({ status: "paid" }), null);
  assert.equal(parseConfirmation(null), null);
});

test("the reference comes from either query parameter, and must look like one", () => {
  assert.equal(referenceFrom({ reference: "NBA-abc123" }), "NBA-abc123");
  assert.equal(referenceFrom({ trxref: "NBA-abc123" }), "NBA-abc123");
  assert.equal(referenceFrom({ reference: ["NBA-a", "NBA-b"] }), "NBA-a");
  assert.equal(referenceFrom({ reference: "<script>" }), null);
  assert.equal(referenceFrom({}), null);
});
