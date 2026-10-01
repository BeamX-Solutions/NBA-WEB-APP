# Phase 3: installable app, offline, onboarding

## Goal

Make the web app installable and useful offline, as `AGENTS.md` scopes it ("PWA installability", "offline-status indication"), and add the parts of mobile the web still lacks:

1. It can be installed to a phone's home screen or a desktop, with the NBA icon and name, opening without browser bars.
2. The fee calculator works with no connection. Anything needing the server says it is offline instead of failing.
3. Mobile's offline banner.
4. Mobile's three onboarding slides on a first visit.
5. Fonts and icons served by the app itself, so nothing depends on Google at runtime.
6. Housekeeping: `typecheck` and `test` scripts, and a real README.

Branch: `feat/pwa-offline-phase-3`, created from `feat/mobile-parity-phase-1`, which is in review and this work builds on. Its PR targets `feat/mobile-parity-phase-1` until that merges, then `main`. No database changes. No new dependencies.

## Skills and docs read

- `AGENTS.md`, `.agents/skills/supabase/SKILL.md` (no data-layer changes here).
- Next 16 docs: `02-guides/progressive-web-apps.md` (manifest via `app/manifest.ts`; HTTPS; `sw.js` headers; security headers) and `04-functions/use-offline.md`.
  - `useOffline` is **experimental**, and its config turns on automatic retry of failed server actions. Retrying "Generate Invoice" could create a duplicate invoice, so it is **not used**.
  - The guide suggests Serwist for caching. That is a new dependency, and this is small enough to write by hand.

## Code inspected

- Mobile: `components/ui/OfflineBanner.tsx` (copy: "You are offline. The calculator still works; invoices and uploads will not."), `app/onboarding.tsx` + `lib/onboarding.tsx` (three slides, a stored seen-flag, Skip / Next / Get started), `app.json` (name "NBA Legal Fees", background `#F7F8F7`), `assets/images/icon.png` (1024×1024) and the three `onboarding-*.jpg` (1000px wide, 31–59 KB, Unsplash licence per mobile's note).
- Web: `app/layout.tsx` (Google Material Icons stylesheet; `next/font/google` already serves Playfair and Source Sans from `/_next/static/media` at runtime), `components/mobile/app-shell.tsx`, `components/calculator/*` (the fee maths runs in the browser), `components/auth/login-form.tsx`, `proxy.ts` (matcher), `next.config.ts`, `package.json`, `README.md`.

## Decisions

1. **Manifest** (`app/manifest.ts`):
   - Name "NBA Legal Fees", short name "NBA Fees", `display: standalone`, `start_url: /`, `scope: /`.
   - `background_color` `#F7F8F7`, `theme_color` `#0B5D33` (mobile's tokens).
   - Icons 192 and 512 (`any`) plus a 512 `maskable` with safe padding, generated once from mobile's `icon.png` into `public/icons/`.
   - An Apple touch icon, and `appleWebApp` / `themeColor` metadata in `app/layout.tsx` for iOS.
2. **Service worker** (`public/sw.js`, hand-written, about 80 lines), registered from a small client component in the root layout. Production only; dev skips it.
   - **Precache on install:** a new public `/offline` page, its JS and CSS chunks (read from its HTML), the seal, the icons, the onboarding images and the local icon font.
   - **`/_next/static/*`, `/fonts/*`, `/icons/*`:** cache-first. These files are fingerprinted or immutable.
   - **Page navigations:** always network-first and **never cached**. When the network fails, the worker serves the precached `/offline` page. Signed-in pages hold personal and financial data, so no copy of them is kept on the device. The same goes for invoices and certificates: an old copy could show a stale payment status.
   - **Never touched by the worker:** API routes, server actions, PDFs, proof uploads, anything other than GET, and Supabase requests.
   - Old caches are cleared when a new version activates. `sw.js` is served with `Cache-Control: no-cache` (next.config headers), so updates arrive on the next visit.
3. **`/offline` page:** public, outside the proxy matcher, and holds no user data.
   - It shows the offline banner, the calculator (document type, amount, breakdown), and a note that invoices, uploads and certificates need a connection.
   - "Generate Invoice" and "Terms of Engagement" are replaced by that note.
   - It reuses `CalculatorFlow` with an offline flag. This is not a copy of the calculator.
4. **Offline banner** (`components/mobile/offline-banner.tsx`):
   - A dark bar at the top, following mobile, with mobile's exact text. Driven by `navigator.onLine` and the `online` / `offline` events. It only appears on an explicit offline signal, so it doesn't flash on load.
   - Shown on every screen through the root layout.
   - While offline, the Generate Invoice, Submit for Verification, Save Changes and Download PDF buttons are disabled with an "Offline" label, so a failed request is never mistaken for a bug.
5. **Onboarding** (`components/onboarding/onboarding.tsx`):
   - Mobile's three slides, words and images, over `/login` on the first visit.
   - Skip, a dot indicator, and Next / Get started. Swipe on touch, arrow keys on desktop.
   - A `localStorage` flag (`onboarding.seen.v1`, mobile's key). If storage fails, the slides are treated as seen so nobody is locked out.
   - Not shown to signed-in users or on `/register`.
6. **Local icon font:**
   - Download Google's Material Icons font once into `public/fonts/material-icons.woff2` (Apache 2.0) and declare it with `@font-face` in `globals.css`.
   - Remove the Google stylesheet link. No runtime request leaves the app's origin for fonts or icons after this.
7. **Housekeeping:**
   - `package.json`: `"typecheck": "next typegen && tsc --noEmit"` and `"test": "node --test \"lib/**/*.test.ts\""`.
   - `README.md` rewritten: what the app is, setup and env vars, scripts, folder map, the PWA and offline behaviour, links to `prompts/`.

## Files expected

- **New:**
  - `app/manifest.ts`, `app/offline/page.tsx`
  - `public/sw.js`, `public/icons/*`, `public/onboarding/*.jpg`, `public/fonts/material-icons.woff2`
  - `components/pwa/service-worker-registration.tsx`
  - `components/mobile/offline-banner.tsx`, `lib/use-online.ts`
  - `components/onboarding/onboarding.tsx`, `lib/onboarding.ts` (+ test)
- **Changed:**
  - `app/layout.tsx`, `app/globals.css`, `next.config.ts` (sw.js headers)
  - `components/calculator/calculator-flow.tsx` (offline flag)
  - The submit buttons named in decision 4
  - `app/login/page.tsx` or `components/auth/login-form.tsx`
  - `package.json`, `README.md`

## Security

- The worker never caches navigations, API responses, PDFs, proofs or Supabase traffic, so no personal or financial data is stored on the device.
- `/offline` is static and anonymous. The worker's scope is `/`, it is served from the same origin, and it gets strict `sw.js` headers.
- No automatic retry of server actions, so a flaky connection can never create a duplicate invoice.
- The onboarding flag is not sensitive.

## Acceptance criteria

- Chrome and Edge offer "Install app". Installed, it opens standalone with the NBA icon, name and green theme. iOS "Add to Home Screen" shows the correct icon.
- With the network off in dev tools (after one online visit), any navigation shows `/offline`. The calculator there gives the same figures as online. No signed-in page appears from cache.
- The offline banner shows within a second of going offline and disappears on reconnect. Server-dependent buttons are disabled while offline.
- A first visit to `/login` shows the three slides. Skip or Get started never shows them again in that browser.
- No request goes to fonts.googleapis.com or fonts.gstatic.com at runtime.
- `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass.

## Checks

The four scripts above. Then a production smoke test (`next build && next start`), checking with headless Edge (device emulation, as in the design-parity check):

- `/manifest.webmanifest` and `/sw.js` are served with the right headers.
- The worker installs and precaches `/offline`.
- With the network emulated off, a navigation returns the offline page.
- The login page shows onboarding on a fresh profile and not after Skip.

## Execution record

Implemented on `feat/pwa-offline-phase-3` (from `feat/mobile-parity-phase-1`). Not committed.

- **Install icons** were generated from mobile's `nba-logo.png`, the icon mobile's `app.json` actually uses. The `icon.png` named in the plan turned out to be Expo's template placeholder.
- **Service worker:** `public/sw.js`, precaching `/offline` plus the scripts and styles its HTML references. Navigations are never cached.
- **Dev tools cannot test this offline:** their "offline" setting doesn't apply to service-worker requests, so the fallback was verified by stopping the server.
- **Offline behaviour:**
  - `/offline` reuses `CalculatorFlow` with an `offline` flag, and its "Try again" reloads the requested address.
  - Generate Invoice, Submit for Verification, Save Changes, Change Photo and both Download PDF buttons are disabled when the browser reports it is offline.
- **Onboarding** shows over `/login` on the first visit, with mobile's key and copy.
- **Fonts and icons:** Material Icons is served from `public/fonts/material-icons.woff2`; the Google stylesheet link is gone. The PDF routes' file tracing is narrowed to `DejaVu*.ttf`.
- **Checks:** `npm run typecheck` passed. `npm run lint` passed. `npm test` gave 83/83. `npm run build` passed (`/offline` and `/manifest.webmanifest` are static).
- **Smoke test** (production server, headless Edge at 390px through the DevTools protocol):
  - `sw.js` served with `no-cache, no-store, must-revalidate` and a JavaScript content type; manifest served.
  - Onboarding shown on a fresh profile, gone after Skip and a reload.
  - Worker active, with 21 to 25 entries precached, including `/offline`.
  - No request to any host other than the app itself.
  - With the server stopped, `/transactions`, `/certificates/<id>` and `/` each rendered the offline page at their own address, with the icon font loaded from cache.
  - The offline calculator gave ₦5,500,000 for a ₦60M assignment and offered no invoice button.
- **Not run:**
  - installing the app on a real phone (needs an HTTPS deployment);
  - the Chrome install prompt (headless);
  - the banner on a real connection drop (it follows `navigator.onLine`, which stays true when only the server is down).

## Manual test steps

1. `npm run build && npm run start` (the worker is production only). Open `http://localhost:3000`; localhost counts as secure.
2. Fresh browser profile: `/login` shows the slides. Swipe or use Next, Skip, then reload; the slides don't return.
3. Chrome or Edge: the install icon in the address bar, then Install. It opens in its own window with the NBA icon.
4. Sign in and open a few pages. In dev tools, Network, choose Offline:
   - the banner appears;
   - navigating anywhere shows the offline calculator;
   - calculating a fee works;
   - Generate Invoice is not offered.
5. Back online: the banner goes, and pages load normally.
6. On a phone (deployed over HTTPS): Add to Home Screen, open it, then turn on airplane mode and repeat step 4.
7. In the Network tab, confirm there are no requests to Google font hosts.
