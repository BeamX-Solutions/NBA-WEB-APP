import assert from "node:assert/strict";
import test from "node:test";
import { notificationLink, parseNotification, relativeTime, unreadBadge } from "./contracts.ts";

const now = new Date("2026-10-01T12:00:00Z");
const row = {
  id: "b18c2bad-bfcb-40d5-b7d0-1c6ea836a3d6", kind: "payment_rejected", title: "Payment proof rejected",
  body: "INV-0001: Amount does not match.", link: "/transactions/96e8931a-3578-46b0-8109-620f2f1baefd",
  created_at: "2026-10-01T11:55:00Z", read_at: null,
};

test("a stored notification becomes an unread inbox row", () => {
  assert.deepEqual(parseNotification(row, now), {
    id: row.id, kind: "payment_rejected", title: "Payment proof rejected", body: "INV-0001: Amount does not match.",
    link: "/transactions/96e8931a-3578-46b0-8109-620f2f1baefd", when: "5 min ago", read: false,
  });
  assert.equal(parseNotification({ ...row, read_at: "2026-10-01T11:56:00Z" }, now)?.read, true);
});

test("malformed rows are dropped rather than shown", () => {
  for (const value of [null, [], { ...row, id: "1" }, { ...row, kind: "forged" }, { ...row, title: " " }, { ...row, body: null }, { ...row, created_at: "bad" }, { ...row, read_at: 5 }]) {
    assert.equal(parseNotification(value, now), null);
  }
});

test("only internal paths are followed", () => {
  assert.equal(notificationLink("/certificates/abc"), "/certificates/abc");
  assert.equal(notificationLink("https://evil.example/x"), null);
  assert.equal(notificationLink("//evil.example/x"), null);
  assert.equal(notificationLink("javascript:alert(1)"), null);
  assert.equal(notificationLink(null), null);
  assert.equal(parseNotification({ ...row, link: "https://evil.example" }, now)?.link, null);
});

test("times read the way people say them", () => {
  assert.equal(relativeTime(new Date("2026-10-01T11:59:30Z"), now), "Just now");
  assert.equal(relativeTime(new Date("2026-10-01T09:00:00Z"), now), "3 h ago");
  assert.equal(relativeTime(new Date("2026-09-30T10:00:00Z"), now), "Yesterday");
  assert.equal(relativeTime(new Date("2026-09-04T10:00:00Z"), now), "4 September 2026");
});

test("the badge caps at 9+ and hides at zero", () => {
  assert.equal(unreadBadge(0), "");
  assert.equal(unreadBadge(3), "3");
  assert.equal(unreadBadge(12), "9+");
});
