import assert from "node:assert/strict";
import test from "node:test";
import { firstNameOf, greetingFor } from "./names.ts";

test("greets by first name, skipping honorifics", () => {
  assert.equal(firstNameOf("Barr. Oluwaseun Adebayo"), "Oluwaseun");
  assert.equal(firstNameOf("Chief Dr Ada Okafor SAN"), "Ada");
  assert.equal(firstNameOf("  "), null);
  assert.equal(firstNameOf(null), null);
});

test("greeting follows the time of day", () => {
  assert.equal(greetingFor(0), "Good morning");
  assert.equal(greetingFor(11), "Good morning");
  assert.equal(greetingFor(12), "Good afternoon");
  assert.equal(greetingFor(16), "Good afternoon");
  assert.equal(greetingFor(17), "Good evening");
});
