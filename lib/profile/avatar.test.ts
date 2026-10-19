import assert from "node:assert/strict";
import test from "node:test";
import { avatarDisplayUrl, avatarPathFor, avatarPathFrom, isAvatarType, matchesAvatarSignature } from "./avatar.ts";

const supabase = "https://project.supabase.co";
const user = "2e000000-0000-0000-0000-0000000000a1";
const prefix = `${supabase}/storage/v1/object/public/avatars/`;

test("an upload gets its own path in the practitioner's folder", () => {
  assert.equal(avatarPathFor(user, "image/png", 1700000000000), `${user}/avatar-1700000000000.png`);
});

test("mobile's stored path and this app's older full URL both resolve to the object path", () => {
  assert.equal(avatarPathFrom(`${user}/avatar.jpg`, supabase), `${user}/avatar.jpg`);
  assert.equal(avatarPathFrom(`${prefix}${user}/avatar-1.jpg`, supabase), `${user}/avatar-1.jpg`);
  assert.equal(avatarPathFrom(`${prefix}${user}/avatar-1.jpg?x=1`, supabase), `${user}/avatar-1.jpg`);
});

test("anything outside this project's avatars bucket is not shown", () => {
  assert.equal(avatarPathFrom("https://evil.example/avatars/x.jpg", supabase), null);
  assert.equal(avatarPathFrom(`${user}/../other/x.jpg`, supabase), null);
  assert.equal(avatarPathFrom("not-a-user/avatar.jpg", supabase), null);
  assert.equal(avatarPathFrom(null, supabase), null);
  assert.equal(avatarPathFrom("", supabase), null);
});

test("the display URL carries the profile version so a replaced photo is fetched again", () => {
  assert.equal(avatarDisplayUrl(`${user}/avatar.jpg`, supabase, "2026-10-19T10:00:00+00:00"), `${prefix}${user}/avatar.jpg?v=2026-10-19T10%3A00%3A00%2B00%3A00`);
  assert.equal(avatarDisplayUrl(`${user}/avatar.jpg`, `${supabase}/`), `${prefix}${user}/avatar.jpg`);
});

test("only the three photo types are accepted, and their contents must match", () => {
  assert.equal(isAvatarType("image/png"), true);
  assert.equal(isAvatarType("image/svg+xml"), false);
  assert.equal(matchesAvatarSignature("image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(matchesAvatarSignature("image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(matchesAvatarSignature("image/webp", Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50])), true);
  assert.equal(matchesAvatarSignature("image/png", new TextEncoder().encode("hello, not a png")), false);
});
