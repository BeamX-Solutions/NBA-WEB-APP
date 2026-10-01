import assert from "node:assert/strict";
import test from "node:test";
import { installKind, isInAppBrowser, isIos, parseDismissedAt, shouldShowBanner, SNOOZE_DAYS, type InstallFacts } from "./install.ts";

const iphoneSafari = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const iphoneChrome = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1";
const ipadDesktopMode = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const androidChrome = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
const instagramIos = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0";
const facebookAndroid = "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0]";
const desktopFirefox = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0";

const base: InstallFacts = { userAgent: androidChrome, maxTouchPoints: 5, standalone: false, hasPromptEvent: false, installedFlag: false };

test("iPhones and iPads in desktop mode are recognised; a Mac without touch is not", () => {
  assert.equal(isIos(iphoneSafari, 5), true);
  assert.equal(isIos(iphoneChrome, 5), true);
  assert.equal(isIos(ipadDesktopMode, 5), true);
  assert.equal(isIos(ipadDesktopMode, 0), false);
  assert.equal(isIos(androidChrome, 5), false);
});

test("in-app browsers that cannot install are recognised", () => {
  assert.equal(isInAppBrowser(instagramIos), true);
  assert.equal(isInAppBrowser(facebookAndroid), true);
  assert.equal(isInAppBrowser(iphoneSafari), false);
  assert.equal(isInAppBrowser(androidChrome), false);
});

test("each browser gets the install path it supports", () => {
  assert.equal(installKind({ ...base, hasPromptEvent: true }), "one-tap");
  assert.equal(installKind({ ...base, userAgent: iphoneSafari }), "ios-guide");
  assert.equal(installKind({ ...base, userAgent: iphoneChrome }), "ios-guide");
  assert.equal(installKind({ ...base, userAgent: desktopFirefox, maxTouchPoints: 0 }), "unsupported");
  assert.equal(installKind({ ...base }), "unsupported");
});

test("the installed app is never asked to install itself", () => {
  assert.equal(installKind({ ...base, standalone: true, hasPromptEvent: true }), "installed");
  assert.equal(installKind({ ...base, userAgent: iphoneSafari, standalone: true }), "installed");
  assert.equal(installKind({ ...base, installedFlag: true }), "installed");
});

test("a browser offering the install again outranks an old installed flag", () => {
  assert.equal(installKind({ ...base, installedFlag: true, hasPromptEvent: true }), "one-tap");
});

test("the banner is snoozed for 14 days after Not now", () => {
  const now = Date.UTC(2026, 9, 2);
  const day = 24 * 60 * 60 * 1000;
  assert.equal(shouldShowBanner("one-tap", null, now), true);
  assert.equal(shouldShowBanner("ios-guide", now - day, now), false);
  assert.equal(shouldShowBanner("ios-guide", now - SNOOZE_DAYS * day, now), true);
  assert.equal(shouldShowBanner("installed", null, now), false);
  assert.equal(shouldShowBanner("unsupported", null, now), false);
  assert.equal(shouldShowBanner("unknown", null, now), false);
});

test("an unreadable stored dismissal counts as none", () => {
  assert.equal(parseDismissedAt("1759363200000"), 1759363200000);
  for (const value of [null, "", "soon", "-1", "1.5", "99999999999999999999"]) assert.equal(parseDismissedAt(value), null);
});
