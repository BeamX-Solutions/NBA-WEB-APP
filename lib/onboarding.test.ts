import assert from "node:assert/strict";
import test from "node:test";
import { hasSeenOnboarding, markOnboardingSeen, ONBOARDING_KEY, slides } from "./onboarding.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

test("a first visit has not seen the slides; marking them seen persists", () => {
  const storage = memoryStorage();
  assert.equal(hasSeenOnboarding(storage), false);
  markOnboardingSeen(storage);
  assert.equal(hasSeenOnboarding(storage), true);
  assert.equal(storage.getItem(ONBOARDING_KEY), "true");
});

test("unavailable or failing storage never locks anyone behind the slides", () => {
  assert.equal(hasSeenOnboarding(undefined), true);
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(hasSeenOnboarding(broken), true);
  assert.doesNotThrow(() => markOnboardingSeen(broken));
});

test("there are mobile's three slides, each with an image", () => {
  assert.equal(slides.length, 3);
  for (const slide of slides) assert.match(slide.image, /^\/onboarding\/.+\.jpg$/);
});
