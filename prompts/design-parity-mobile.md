# Design parity: rebuild the web screens on the mobile design system

## Goal

The user wants the web app to look like the mobile app ("copy the exact designs from the mobile folder"). Today the web uses its own look: the Geist font and about 120 hard-coded pixel sizes across 19 components, plus a separate reference-image styling layer. Mobile has one small, consistent design system. This work ports that system to the web and rebuilds every practitioner screen from its mobile counterpart.

The mobile screens are the reference: `NBA APP/mobile/app/**` and `components/ui/**`. Per `AGENTS.md` section 3, with mobile-only references we reproduce mobile exactly at phone widths and adapt sensibly upward.

Branch: continue on `feat/mobile-parity-phase-1` (user instruction: no new branches). No database or behaviour changes: data loading, server actions, routes, security and copy logic stay as they are. This is presentation only.

## Mobile design system (source of truth)

From `mobile/theme/tokens.ts`, `lib/fonts.ts` and `components/ui/*`:

- **Fonts:** Playfair Display 600/700 for headings and section titles; Source Sans 3 400/500/600/700 for everything else.
- **Palette:**
  - Brand: primary `#0B5D33` (pressed `#084526`), primaryText `#0E6B3A`, primarySurface `#E7F0EA`.
  - Accent: `#F5C33B` (surface `#FDF3D4`, text `#8A6100`).
  - Surfaces: background `#F7F8F7`, surface `#FFF`, surfaceMuted `#F2F4F2`.
  - Borders: border `#E3E6E3`, borderStrong `#C9CFCA`.
  - Text: text `#1A1A1A`, textMuted `#6B7280`, textDisabled `#9CA3AF`.
  - Status: success `#1B8A4B`/`#E6F4EC`, neutral `#EDEFED`/`#6B7280`, danger `#C2371F`/`#FBEAE7`.
  - Scrim: `rgba(17,24,19,.45)`.
- **Type scale:** caption 12, label 14, body 15, bodyLarge 16, title 20, heading 24, display 30.
- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32.
- **Radius:** input 8, button 10, card 12, pill.
- **Components:**
  - `Screen`: 16px padding, background colour.
  - `ScreenHeading`: Playfair 24 bold with a 15 muted subtitle.
  - `SectionTitle`: Playfair 16 in primaryText, 20px icon, optional underline.
  - `SettingsRow`, `DetailRow` (12 uppercase label over a 15 value; 16 semibold when emphasised).
  - `Card`: white, 1px border, radius 12, padding 16.
  - `Button`: primary, outline or danger; min height 48, radius 10, 16 semibold label.
  - `TextField` / `SelectField`: 14 semibold label, 50px control with a borderStrong border and radius 8; 16px text; 12px hint or error. SelectField opens a bottom sheet with search when there are more than 10 options.
  - `StatusBadge` / `Badge`: pills with 12 semibold text, in the status colours.
  - States: `EmptyState`, `ErrorState`, `LoadingState` and `ConfirmDialog`, each with an 84px icon circle and a Playfair 20 title.
  - `Stepper`: 28px dots in a 4px ring.
  - `AppHeader`: 36px seal on the left; 38px avatar on the right, or a "Log in" pill when signed out.
  - Tab bar: Calculator, Transactions, Certificates, Profile; 68px tall; the active tab gets an amber pill with green text; 12 semibold labels.
- **Icons:** Material Icons (the set `@expo/vector-icons/MaterialIcons` uses), by the same names as mobile.

## Decisions

1. **Tokens** go into `app/globals.css` as `@theme` variables with mobile's exact values (colours `--color-*`, text sizes `--text-caption` through `--text-display`, radii, fonts), so Tailwind classes such as `text-body`, `bg-surface`, `rounded-card` and `font-heading` resolve to them. Hard-coded pixel sizes and hex colours are removed from the screens being rebuilt.
2. **Fonts** load with `next/font/google` (Playfair Display 600/700, Source Sans 3 400/500/600/700), replacing Geist in `app/layout.tsx`. No new dependency.
3. **Icons:** a small `components/mobile/icon.tsx` renders Material Icons by name from Google's Material Icons font, loaded once in the root layout, so every icon name matches mobile. This is the only external stylesheet. Phase 3 (PWA/offline) will self-host it.
4. **Web UI kit** in `components/mobile/`, one component per mobile component, same names, props and styling:
   - `Screen`, `ScreenHeading`, `SectionTitle`, `SettingsRow`, `DetailRow`
   - `Card`, `Button` (variants primary, outline and danger; also renders as a link)
   - `TextField`, `SelectField` (bottom sheet on phones, centred dialog on desktop), `Field`
   - `StatusBadge`, `Badge`
   - `EmptyState`, `ErrorState`, `LoadingState`, `ConfirmDialog`
   - `Stepper`, `AppHeader`, `TabBar`
   - `AppShell`: header, content and tab bar together.

   The existing `components/ui/*` and profile/auth helpers are replaced where screens move to the kit. They are deleted once unused, along with the `auth-*` and `reference-*` CSS.
5. **Screens rebuilt from their mobile counterparts** (layout, order, copy, sizes):

   | Web route | Mobile source |
   |---|---|
   | `/login`, `/register`, `/forgot-password`, `/reset-password` | `(auth)/login`, `register`, `forgot-password` (reset follows forgot-password's layout) |
   | `/` calculator (and invoice creation) | `(tabs)/index`, `transaction/new` |
   | `/transactions` | `(tabs)/transactions` |
   | `/transactions/[id]` | `transaction/[id]` |
   | `/transactions/[id]/invoice` | `transaction/invoice/[id]` |
   | `/certificates` | `(tabs)/certificates` |
   | `/certificates/[id]` | `certificate/[id]` |
   | `/profile`, `/profile/edit` | `(tabs)/profile`, `profile/edit` |
   | `/profile/notifications`, `/profile/security`, `/profile/help` | `settings/notifications`, `security`, `help` |
   | `/profile/plans` | `subscription/plans` |
   | `/verify`, `/verify/...` | `verify/[rbin]` |
   | `/membership`, `/administrator-account` | `components/ui/MembershipPending`, `AdminWebOnly` |

   Mobile's `onboarding`, `subscription/payment`, `result` and `OfflineBanner` have no web screen yet. They stay in Phase 3, not here.
6. **Desktop adaptation**, since the references are phone-only:
   - Below 800px, exactly the mobile layout.
   - From 800px the header stays; the tab bar moves into the header as four text-and-icon links with the same amber active pill; content sits in a centred column (720px for forms and detail screens).
   - The calculator shows its form and result side by side.
   - The Transactions and Certificates lists become two-column card grids.
   - Type sizes and component styling stay the mobile values at every width, with no desktop enlargement. That removes the disparity the user objected to.
7. **Behaviour preserved:** every data loader, action, route, validation, `aria` attribute, focus trap and error message stays. Only markup and styling change. Where mobile and web copy differ, mobile's copy wins, unless the web copy carries a fact mobile lacks: the web's PDF download, share fallback and bank-details link stay.
8. **Certificate and invoice PDFs** are unchanged. They already follow mobile's print templates.

## Files expected

- **New:** `components/mobile/*` (the kit, about 12 small files).
- **Changed:**
  - `app/globals.css` (tokens; legacy classes removed once unused), `app/layout.tsx`
  - Every page and component under `app/` and `components/` for the routes above
  - `components/design-system/design-system-overview.tsx` and `lib/design-system/tokens.ts` are left alone if still unused by any route; otherwise their token names are reconciled.
- **Deleted when unused:** `components/ui/{button,card,badge,input,form-notice,confirm-dialog}.tsx`, `components/profile/profile-ui.tsx`, `components/auth/auth-ui.tsx`, `components/transactions/transaction-shell.tsx`, `components/membership/gate-screen.tsx`, `components/verify/verify-view.tsx`.

## Security

No change to data access, auth, RLS or storage. The only new external resource is the Google Material Icons stylesheet, which carries no user data.

## Acceptance criteria

- At 390px width, each screen in the table matches its mobile screen side by side: fonts, sizes, colours, spacing, radii, icons, order of elements and copy.
- No hard-coded `text-[Npx]` sizes or stray hex colours remain in the rebuilt screens; everything goes through the tokens.
- Desktop follows decision 6 without changing type sizes.
- All flows still work: sign in, calculate, create an invoice, copy/share, upload proof, certificates, PDFs, verify, profile edit, membership and administrator gates.
- Type check, lint, all unit tests and build pass.

## Checks

`npx next typegen`, `npx tsc --noEmit`, `npm run lint`, `node --test "lib/**/*.test.ts"`, `npm run build`, and a signed-out smoke test of `/login`, `/register`, `/forgot-password` and `/verify` on `next dev` (HTML contains the new font classes and components).

## Execution record

Implemented on `feat/mobile-parity-phase-1`. Not committed.

- **Kit:** `components/mobile/` holds icon, card, screen (`Screen`, `ScreenHeading`, `SectionTitle`, `SettingsRow`, `DetailRow`), button, field (`TextField`, `SelectField` sheet), control, badge, states (`EmptyState`, `ErrorState`, `LoadingState`, `Notice`, `IconCircle`), confirm-dialog, stepper, tab-nav and app-shell. Mobile tokens are in `app/globals.css` `@theme`. Fonts are Playfair Display and Source Sans 3 via `next/font/google`. Icons come from the Material Icons stylesheet.
- **Screens rebuilt from mobile:** login, register (including the "Confirm your email" state), forgot/reset password, calculator (with the greeting and live amount grouping), invoice step, transactions list, transaction detail, invoice, certificates list and detail, profile, edit profile, security, notifications, help, plans, verify, membership and administrator.
- **Helpers ported with tests:** `lib/names.ts` (`firstNameOf`, `greetingFor`) and `groupNairaInput`.
- **Bug fixed along the way:** Profile showed the subscription amount 100x too large (kobo formatted as naira).
- **Deleted, superseded:** `components/ui/*`, `auth-ui`, `branch-picker`, `profile-ui`, `transaction-shell`, and the unrouted `design-system-overview` with `lib/design-system/tokens.ts`. The legacy CSS is gone from `globals.css`.
- **Deviations from mobile, kept on purpose:**
  - Login omits mobile's "Remember Me" checkbox, which does nothing on mobile.
  - Security keeps the web's current-password field.
  - Help FAQ 6 is rewritten, because the web has no branch-request flow.
  - The Certificates "Request Archive" link goes to Help & Support.
  - Plans "Continue to Payment" shows mobile's "Payment not yet available" message inline, because there is no payment screen yet.
- **Checks:** `npx tsc --noEmit` passed. `npm run lint` passed with 0 problems. `node --test "lib/**/*.test.ts"` gave 80/80. `npm run build` passed.
- **Rendering check:**
  - Headless Edge driven through the DevTools protocol at an emulated 390px device and at 1280px. Login, register, forgot password and verify (form and not-found) match the mobile layout.
  - This caught one defect: the verify page called a client-only helper from a server component. That helper moved to `components/mobile/control.ts`.
- **Not verified visually:** every signed-in screen (no test account here).

## Manual test steps

1. Run `npm run dev`. Open the mobile app in Expo Go (or `npm start` then `w` for its web preview) beside the web app at 390px in browser dev tools.
2. Compare Login, Register and Forgot Password.
3. Sign in. Compare the Calculator: pick a document, calculate, open Generate Invoice.
4. Compare Transactions (search, status filter), a transaction's detail, and its invoice.
5. Compare Certificates, a certificate's detail, and Verify (signed out).
6. Compare Profile, Edit Profile, Notifications, Security, Help and Plans.
7. Resize to 768px and 1280px and check decision 6: header navigation, centred column, calculator side by side, two-column lists.
8. Repeat one full flow (calculate, invoice, upload proof) to confirm behaviour is unchanged.
