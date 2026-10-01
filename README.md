# NBA Legal Fees: practitioner web app

The web version of the practitioner app for Nigerian lawyers and NBA branches. A practitioner calculates the prescribed minimum fee under the Legal Practitioners (Remuneration) Order, 2023, issues an invoice their client pays into the branch account, uploads the payment slip, and receives a Certificate of Compliance that anyone can verify by its RBIN.

It mirrors the Expo mobile app in the `NBA APP` repository, which is the source of truth for fee rules and screen design. The database (Supabase: auth, PostgreSQL, row-level security, storage) is shared with that app and the branch admin console, and its schema lives in `NBA APP/supabase/migrations`, not here.

## Setup

Node 24.

```sh
npm ci
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev                  # http://localhost:3000
```

`.env.local` needs three public values:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, from Supabase settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (anon) key. Never a service-role key |
| `NEXT_PUBLIC_VERIFICATION_URL` | Host printed into certificate QR codes. Must match mobile's `EXPO_PUBLIC_VERIFICATION_URL` and must not change once real certificates are issued |

In Supabase Auth, allow `/auth/callback` and `/auth/callback?flow=recovery` as redirect URLs for each origin.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run typecheck` | Generates route types and runs TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (`node --test`, TypeScript run natively by Node 24) |
| `npm run build` / `npm run start` | Production build and server |

Run all four checks before a pull request. Creating an invoice writes to the shared database, so test with a test account.

## Where things live

| Path | Holds |
| --- | --- |
| `app/` | Pages and server routes: calculator (`/`), transactions and invoices, certificates, profile, `/verify`, `/membership`, `/administrator-account`, `/offline` |
| `proxy.ts` | Sign-in check, and the membership and administrator redirects |
| `components/mobile/` | The design system ported from mobile: screen, card, button, fields, badges, states, dialog, stepper, app shell, offline banner |
| `components/<feature>/` | Screens by feature: auth, calculator, transactions, certificates, profile, membership, verify, onboarding |
| `lib/fees/` | The fee engine (ported from mobile) and its tests |
| `lib/pdf/` | Server-drawn invoice and certificate PDFs |
| `lib/` (other) | Data loading and validation per feature, access rules, helpers |
| `public/sw.js` | The service worker |
| `prompts/` | The plan and verification record for each piece of work (git-ignored; add with `git add -f`) |

Design tokens (colours, text sizes, radii, fonts) are in `app/globals.css`. Use the token classes (`bg-primary`, `text-body`, `rounded-card`) and the `components/mobile` kit rather than hard-coded sizes or colours.

## Installable and offline

- The app has a web manifest (`app/manifest.ts`), so browsers offer to install it. Installed, it opens in its own window with the NBA icon.
- `public/sw.js` runs in production builds only (set `NEXT_PUBLIC_ENABLE_SW=true` to try it under `next dev`).
- **Cached:** the `/offline` page and static files (build assets, fonts, icons, onboarding images).
- **Never cached:** signed-in pages, API responses, PDFs and uploads, because they hold personal data and payment status changes.
- Offline, any page shows `/offline`, where the fee calculator works in full. Actions that need the server are disabled with an "Offline" label, and a banner explains what still works.
- Fonts and icons are served from this origin; nothing is fetched from Google at runtime.

## Roles

Practitioners use this app. Branch administrators and super administrators are separate accounts that work in the admin console; this app sends them to `/administrator-account`. The database, not this app, is what enforces that.
