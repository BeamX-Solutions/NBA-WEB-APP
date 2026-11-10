import assert from "node:assert/strict";
import test from "node:test";
import { allowedReplyHref, parseReply } from "./reply.ts";

const id = "96e8931a-3578-46b0-8109-620f2f1baefd";

test("a link to the practitioner's own transaction stays a link", () => {
  assert.deepEqual(parseReply(`Open [TXN-00012-DOA](/transactions/${id}) to upload proof.`), [[[
    { kind: "text", text: "Open " },
    { kind: "link", text: "TXN-00012-DOA", href: `/transactions/${id}` },
    { kind: "text", text: " to upload proof." },
  ]]]);
});

test("an external or unknown link is reduced to its label", () => {
  assert.deepEqual(parseReply("Pay at [this page](https://evil.example/pay)."), [[[
    { kind: "text", text: "Pay at " },
    { kind: "text", text: "this page" },
    { kind: "text", text: "." },
  ]]]);
  assert.deepEqual(parseReply("[x](//evil.example)"), [[[{ kind: "text", text: "x" }]]]);
});

test("only the allow-listed in-app paths are linkable", () => {
  assert.equal(allowedReplyHref(`/certificates/${id}`), true);
  assert.equal(allowedReplyHref("/payments"), true);
  assert.equal(allowedReplyHref("/profile/plans"), true);
  assert.equal(allowedReplyHref("/transactions/not-an-id"), false);
  assert.equal(allowedReplyHref(`/transactions/${id}/invoice`), false);
  assert.equal(allowedReplyHref("/profile/security"), false);
  assert.equal(allowedReplyHref("javascript:alert(1)"), false);
});

test("bold, bullets, lines and paragraphs", () => {
  assert.deepEqual(parseReply("You have **2** pending:\n- one\n* two\n\nThat is all."), [
    [
      [{ kind: "text", text: "You have " }, { kind: "bold", text: "2" }, { kind: "text", text: " pending:" }],
      [{ kind: "text", text: "• one" }],
      [{ kind: "text", text: "• two" }],
    ],
    [[{ kind: "text", text: "That is all." }]],
  ]);
});

test("markup-looking text is kept as text, never as HTML", () => {
  assert.deepEqual(parseReply("<img src=x onerror=alert(1)>"), [[[{ kind: "text", text: "<img src=x onerror=alert(1)>" }]]]);
});

test("an empty reply has no paragraphs", () => {
  assert.deepEqual(parseReply("\n\n  \n"), []);
});
