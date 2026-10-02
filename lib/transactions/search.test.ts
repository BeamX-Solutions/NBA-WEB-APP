import assert from "node:assert/strict";
import test from "node:test";
import { afterCursorFilter, encodeCursor, PAGE_SIZE, pageOf, parseCursor } from "../paging.ts";
import { cleanSearchTerm, documentTypesMatching, MAX_SEARCH_LENGTH, searchFilter, statusFilter } from "./search.ts";

const id = "b18c2bad-bfcb-40d5-b7d0-1c6ea836a3d6";
const at = "2026-10-01T11:55:00.123456+00:00";

test("a cursor survives the round trip and nothing else is accepted", () => {
  assert.deepEqual(parseCursor(encodeCursor(at, id)), { at, id });
  assert.deepEqual(parseCursor(encodeCursor("2026-10-01T11:55:00Z", id)), { at: "2026-10-01T11:55:00Z", id });
  for (const value of [null, 5, "", "nonsense", `${at}|not-a-uuid`, `yesterday|${id}`, `${at}|${id}|x`, `${at}),id.gt.(|${id}`, `${at}|${id}`.padEnd(90, "0")]) {
    assert.equal(parseCursor(value), null);
  }
});

test("the next page starts strictly after the cursor row", () => {
  assert.equal(afterCursorFilter("created_at", { at, id }), `created_at.lt."${at}",and(created_at.eq."${at}",id.lt.${id})`);
});

test("a page fetched with one extra row reports whether there is more", () => {
  const rows = Array.from({ length: PAGE_SIZE + 1 }, (_, index) => index);
  const full = pageOf(rows, (row) => `cursor-${row}`);
  assert.equal(full.rows.length, PAGE_SIZE);
  assert.equal(full.nextCursor, `cursor-${PAGE_SIZE - 1}`);
  const last = pageOf(rows.slice(0, 3), (row) => `cursor-${row}`);
  assert.deepEqual(last, { rows: [0, 1, 2], nextCursor: null });
});

test("the status filter only accepts the screen's four values", () => {
  assert.equal(statusFilter("awaiting"), "awaiting_payment");
  assert.equal(statusFilter("pending"), "pending_verification");
  assert.equal(statusFilter("verified"), "verified");
  assert.equal(statusFilter("rejected"), "rejected");
  for (const value of ["all", "", "verified,rejected", null, 1]) assert.equal(statusFilter(value), null);
});

test("search terms cannot change the shape of the filter", () => {
  assert.equal(cleanSearchTerm("  INV-ANA-0001 "), "INV-ANA-0001");
  assert.equal(cleanSearchTerm("a,b)(c\"d'e\\f%g_h*i"), "a b c d e f g h i");
  assert.equal(cleanSearchTerm("x".repeat(200)).length, MAX_SEARCH_LENGTH);
  assert.equal(cleanSearchTerm(null), "");
  assert.equal(searchFilter("smith"), "invoice_number.ilike.*smith*,parties.ilike.*smith*");
});

test("a document type is found by the label people see", () => {
  assert.deepEqual(documentTypesMatching("assignment"), ["deed_of_assignment"]);
  assert.deepEqual(documentTypesMatching("mortgage").sort(), ["deed_of_release", "mortgage_deed"].sort());
  assert.deepEqual(documentTypesMatching(""), []);
  assert.equal(searchFilter("gift"), "invoice_number.ilike.*gift*,parties.ilike.*gift*,document_type.in.(deed_of_gift)");
});
