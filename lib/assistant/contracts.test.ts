import assert from "node:assert/strict";
import test from "node:test";
import { MAX_QUESTION_LENGTH, parseAssistantReply, parseAssistantState, parseChatMessages, validQuestion } from "./contracts.ts";

test("the chat's opening state is read, keeping reading order", () => {
  assert.deepEqual(parseAssistantState({ kind: "not-subscribed" }), { kind: "not-subscribed" });
  assert.deepEqual(parseAssistantState({ kind: "ready", messages: [
    { id: "1", role: "user", content: "Hi" },
    { id: "2", role: "assistant", content: "Hello" },
  ] }), { kind: "ready", messages: [
    { id: "1", role: "user", content: "Hi" },
    { id: "2", role: "assistant", content: "Hello" },
  ] });
  assert.equal(parseAssistantState({ kind: "ready" }), null);
  assert.equal(parseAssistantState(null), null);
});

test("a question is trimmed, and refused when empty or too long", () => {
  assert.equal(validQuestion("  What is pending for me?  "), "What is pending for me?");
  assert.equal(validQuestion("   "), null);
  assert.equal(validQuestion(42), null);
  assert.equal(validQuestion("a".repeat(MAX_QUESTION_LENGTH)), "a".repeat(MAX_QUESTION_LENGTH));
  assert.equal(validQuestion("a".repeat(MAX_QUESTION_LENGTH + 1)), null);
});

test("stored messages read oldest first, and malformed rows are dropped", () => {
  assert.deepEqual(parseChatMessages([
    { id: "2", role: "assistant", content: "One invoice is awaiting payment." },
    { id: "x", role: "system", content: "planted" },
    { id: "1", role: "user", content: "What is pending for me?" },
    null,
  ]), [
    { id: "1", role: "user", content: "What is pending for me?" },
    { id: "2", role: "assistant", content: "One invoice is awaiting payment." },
  ]);
  assert.deepEqual(parseChatMessages(null), []);
});

test("the function's reply is read, and an empty one is refused", () => {
  assert.deepEqual(parseAssistantReply({ reply: "Hello", messageId: "abc" }), { reply: "Hello", messageId: "abc" });
  assert.equal(parseAssistantReply({ reply: "  " }), null);
  assert.equal(parseAssistantReply("Hello"), null);
});
