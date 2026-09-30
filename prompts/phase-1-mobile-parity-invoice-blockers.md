# Phase 1: mobile parity, fix what blocks invoices

## Goal

This app is the practitioner web version of the Expo app in `C:\Users\ibehc\Documents\NBA APP\mobile`. Both share one Supabase project (`ygefmmotolfrqnbmtljg`). Phase 1 fixes the gaps that currently stop a practitioner from creating an invoice or that make the web app disagree with mobile on money:

1. Fee engine matches mobile exactly (user decision: mobile is the source of truth).
2. Branch fee is 2% of the professional fee, deducted from it, not a flat ₦30,000 levy added on top.
3. Practitioner bank details can be entered in Edit Profile (the database refuses an invoice without them).
4. Membership approval gate (pending / rejected / resubmit), ready for when the 30 Sep migration is deployed.
5. Administrator accounts are turned away from the practitioner app, as on mobile.
6. The live transaction route no longer serves hardcoded sample transactions.

Branch: `feat/mobile-parity-phase-1`, created from `main` after approval. No database changes in this phase.

## Skills and docs read

- `AGENTS.md`, `.agents/skills/supabase/SKILL.md` (RLS is the boundary, owner-scoped queries, never trust client money, verify with a test query).
- `node_modules/next/dist/docs/` is not present because dependencies are not installed. Run `npm ci` first, then read the proxy, server actions and forms guides before editing `proxy.ts` and actions.
- No new skills or dependencies are needed.

## Code inspected

Mobile (`NBA APP/mobile`): `app/_layout.tsx` (admin block, membership gate), `components/ui/MembershipPending.tsx`, `app/profile/edit.tsx` (bank details), `app/transaction/[id].tsx`, `app/transaction/invoice/[id].tsx`, `lib/fees/{types,calculate,scale-2023,calculate.test}.ts`, `lib/auth-context.tsx`.

Schema (`NBA APP/supabase/migrations`): `20260929100000_client_pays_through_branch.sql` (`branch_fee_for` = 2% half-up, bank columns with NUBAN check, `create_transaction` checks bank details and `p_branch_fee = branch_fee_for(p_professional_fee)`), `20260930100000_branch_approves_members.sql` (membership columns, `resubmit_membership`, `protect_profile_columns` lets an unapproved member edit SCN), storage policies (proof path first folder must be `auth.uid()`; the web path already satisfies this).

Web (this repo): `lib/fees/legal-fees.ts`, `lib/calculator/{contracts,data,types}.ts`, `app/calculator-actions.ts`, `components/calculator/{calculator-flow,preview-flow}.tsx`, `lib/preview/pdf-documents.ts`, `lib/profile/{data,types,validation}.ts`, `app/profile/edit/actions.ts`, `components/profile/profile-edit.tsx`, `proxy.ts`, `app/transactions/[id]/page.tsx`, `components/transactions/transaction-detail.tsx`.

## Deployed schema, verified read-only

Probed with the public anon key (no writes):

- Deployed: `profiles.bank_account_*`, `transactions.branch_fee / due_to_practitioner / remitted_*`, `calculations.net_fee`, `branch_fee_for` (`branch_fee_for(100000)` returned `2000`), `record_remittance`, `verify_rbin`, `list_branches_for_signup`.
- **Not deployed:** `profiles.membership_status` (42703), `review_membership`, `resubmit_membership` (PGRST202). The 30 Sep migration has not been pushed.

## Defects confirmed

- `app/calculator-actions.ts` sends `p_branch_fee = ₦30,000` (`REFERENCE_BRANCH_LEVY_KOBO`). The database requires 2% of the professional fee, so `create_transaction` refuses every invoice except one whose fee is exactly ₦1,500,000.
- The UI tells the practitioner to pay the branch the levy ("Branch Fee Invoice", "Total payable: ₦30,000"). Under the deployed model the client pays the whole professional fee into the branch account; the branch keeps 2% and sends the rest to the practitioner.
- Fee engine differences from mobile: mortgages above ₦100M (web adds a fixed ₦4.5M; mobile sums the bands to ₦3.5M, the correction recorded in the mobile tests and DESIGN_REVIEW.md); Power of Attorney (web computes it under Scale 4A; mobile treats it as discretionary with no scale figure); rounding (web rounds each line, mobile rounds the total once).
- Edit Profile has no bank details, so no web user can satisfy `create_transaction`.
- No membership gate and no administrator block.
- `app/transactions/[id]/page.tsx` returns a hardcoded sample before checking the UUID.

## Decisions

1. **Fee engine.** Rewrite `lib/fees/legal-fees.ts` as a bigint port of the mobile engine: marginal bands 4A (10/5/3%), 4B (4/3/2%), 4C (10/5/5%), summed exactly in kobo and rounded once, half up. Document types carry the mobile metadata: scale, basis label, full-rate party and half-rate party. Power of Attorney throws a typed `FeeCalculationError` with the mobile wording. Keep the existing kebab-case ids and `databaseDocumentTypes` map. `branchFeeFor(professional)` = 2% half-up, mirroring `public.branch_fee_for`. Result shape: `professionalFeeKobo`, `halfRateFeeKobo | null`, `branchFeeKobo`, `netFeeKobo`, `lines`. Remove `REFERENCE_BRANCH_LEVY_KOBO`.
2. **Callers.** Update the calculator result card, the invoice form, the terms-of-engagement PDF and the server action to the new shape. The result card shows the prescribed minimum (what the client pays), the half-rate figure where one exists, "Less branch fee (2%)", and "You receive". Power of Attorney shows the discretionary notice and no Generate Invoice button. Remove the "Underlying transaction" radio.
3. **Server action.** Recompute the fee on the server from validated input (already done) and send `p_branch_fee = branchFeeFor(professional)`. Extend `safeInvoiceErrorMessage` for bank details, membership, a branch fee mismatch and an administrator account. Never pass raw database text to the UI.
4. **Invoice copy.** The success view becomes "Invoice": the client pays the remuneration into the branch account, quoting the reference. Show amount payable, branch fee and "Branch sends you". The full invoice page, copy/share and remittance status move to Phase 2.
5. **Bank details.** Add a Bank Details card to Edit Profile (account name, 10-digit NUBAN, bank). Save all three or none, with a note that the branch pays the fee into this account after deducting 2%. Validate on the server in `validateProfileUpdate` and send only permitted columns. Load the bank fields into the profile and calculator context. `invoiceBlockReason` reports missing bank details with a link to `/profile/edit` before the user submits.
6. **Access gate.** A server-only `lib/practitioner/access.ts` reads the signed-in user's own profile: `role`, `membership_status`, `membership_rejection_reason`, `full_name`, `scn`, `phone`. If the query fails with 42703 (the column is not deployed yet), retry with `role` only and treat the member as approved, which is what the migration does for existing rows. Remove this fallback once the migration is live. `proxy.ts` calls it for the protected matcher only:
   - `branch_admin` / `super_admin` → redirect to `/administrator-account`, which explains that administrators use the branch console and offers sign-out.
   - `pending` → `/membership`: waiting message and a "Check again" button.
   - `rejected` → `/membership`: the branch's reason and a form to correct full name, SCN and phone, plus an optional branch code. A server action updates those three fields on the user's own row, then calls `resubmit_membership(p_branch_code)`. A duplicate SCN (23505) gets a friendly message.
   - Both new pages require a session and bounce approved practitioners to `/`. This is navigation only; the database remains the boundary.
7. **Sample fallback.** Remove `findSampleTransaction` from the live detail route. The sample fixture files stay, since other code imports their types (no unrelated refactor).

## UI note

No reference images were supplied for the new screens (membership, administrator account, bank details card, revised result card). They reuse the existing web components (`ProfileFrame`, `ProfileCard`, `FormNotice`, the existing button and input classes) and follow the mobile screens' content and order. Send reference images to have any of them matched exactly.

## Files expected

- `lib/fees/legal-fees.ts`, `lib/fees/legal-fees.test.ts`
- `lib/calculator/contracts.ts`, `lib/calculator/contracts.test.ts`, `lib/calculator/data.ts`, `lib/calculator/types.ts`
- `app/calculator-actions.ts`
- `components/calculator/calculator-flow.tsx`, `components/calculator/preview-flow.tsx`, `lib/preview/pdf-documents.ts` (and `documents.ts` / test if the fee shape reaches them)
- `lib/profile/types.ts`, `lib/profile/data.ts`, `lib/profile/validation.ts`, `app/profile/edit/actions.ts`, `components/profile/profile-edit.tsx`
- New: `lib/practitioner/access.ts`, `app/membership/page.tsx`, `app/membership/actions.ts`, `components/membership/membership-status.tsx`, `app/administrator-account/page.tsx`
- `proxy.ts`
- `app/transactions/[id]/page.tsx`

## Security

- The publishable/anon key only; no service key. RLS and triggers unchanged.
- Fees and the branch fee are computed on the server; the database checks the branch fee again.
- Profile updates send only `full_name`, `phone`, `practice_state` and the bank columns (and `scn` on the membership page, which the trigger permits only before approval). Never send `role`, `branch_id` or membership columns.
- Every profile read is filtered by `auth.uid()`.
- The access gate is convenience; a pending member or administrator is still refused by `create_transaction`.
- Bank details are the practitioner's own data. Do not log them.

## Acceptance criteria

- For every document type and the boundary amounts in the mobile test suite, the web engine returns the same professional, half-rate, branch and net figures as mobile.
- ₦100,000,000 and ₦100,000,001 mortgages differ by kobo, not by ₦1,000,000.
- Power of Attorney shows the discretionary message and offers no invoice.
- An approved, subscribed practitioner with bank details on an active branch creates an invoice successfully. The stored `amount_payable` equals the professional fee and `branch_fee` equals 2% of it.
- Without bank details the calculator explains why and links to Edit Profile, before any submission.
- Bank details save and reload. Partial details or a non-10-digit number are refused with field errors.
- Administrator accounts reach `/administrator-account` from any protected route. Practitioner accounts are unaffected.
- While the membership migration is undeployed, practitioners are treated as approved and nothing breaks. Once deployed, pending and rejected members see `/membership` and resubmission works.
- `/transactions/<non-uuid>` returns not found; sample data never appears on a live route.
- The existing layout of untouched screens is unchanged.

## Checks

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `node --test "lib/**/*.test.ts"` (Node 24 runs the TypeScript tests natively)
5. `npm run build`. If Turbopack cannot bind its worker port again, report it and run `npm run build -- --webpack`.
6. Read-only schema probe again before merging, to record whether the membership migration has landed.
7. No Supabase test suites: this phase changes no database objects.

## Manual test steps

1. `npm run dev`, then sign in as an existing practitioner.
2. Calculator: Deed of Assignment ₦60,000,000 → ₦5,500,000; Mortgage Deed ₦100,000,000 → ₦3,500,000 and ₦200,000,000 → ₦5,500,000; Tenancy ₦6,000,000 → ₦550,000. Each shows branch fee 2% and "You receive".
3. Select Irrevocable Power of Attorney and confirm the discretionary message and no invoice button.
4. With empty bank details, open Generate Invoice and confirm the bank-details notice and link.
5. Edit Profile: save a partial bank account (refused), then a 9-digit number (refused), then valid details (saved). Reload and confirm they persist.
6. With an active subscription, create an invoice. Confirm the reference, amount payable = professional fee, branch fee and net amount, then open the transaction. **This writes a real transaction to the shared project; do it only with a test account you are happy to leave data on.**
7. Sign in as a branch administrator and open `/`, `/transactions` and `/certificates`; each lands on `/administrator-account`. Sign out works.
8. Visit `/membership` as an approved practitioner and confirm it redirects to `/`.
9. Visit `/transactions/not-a-uuid` and `/transactions/<a sample id>` and confirm both show not found.
10. Check the calculator result, invoice form and Edit Profile at 375px, 768px and desktop widths.

## Execution record

Implemented on `feat/mobile-parity-phase-1` after approval. Not committed.

- Fee engine ported; the web tests now carry the mobile cases (4A/4B/4C boundaries, ₦100M mortgage continuity, the inert 4C boundary, Power of Attorney refusal, 2% branch fee half-up).
- `create_transaction` receives `branchFeeFor(professional)`. Calculator, invoice form, invoice success view and terms PDF use the client-pays-through-branch model.
- Edit Profile has a Bank Details card, validated all-or-none with a 10-digit NUBAN on the server. The calculator blocks invoices without bank details and links to Edit Profile.
- `lib/practitioner/access.ts` plus `proxy.ts` route administrators to `/administrator-account` and pending/rejected members to `/membership`. It falls back to "approved" while `membership_status` is undeployed (TODO marked in code).
- Branch changes on resubmission use a dropdown of active branches from `list_branches_for_signup` rather than mobile's free-text code, matching web registration.
- The sample fallback was removed from `/transactions/[id]`.
- Checks: `npx tsc --noEmit` passed (after `npx next typegen`, which generates the global `LayoutProps` type). `npm run lint` passed. `node --test "lib/**/*.test.ts"` gave 67/67. `npm run build` (Turbopack) passed.
- Smoke test: `next dev` with the public URL/anon key set in the process only. Signed-out `/`, `/membership`, `/administrator-account` and `/profile/edit` return 307 to `/login?next=...`; `/login` and `/register` return 200.
- Not run: every signed-in manual step (no test credentials available here), responsive checks and invoice creation against the shared project.
- The repo has no `.env.local`, so `next start` without env returns 500 on protected routes. This predates the change.
- `prompts/` is in `.gitignore`; committing this file needs `git add -f`.

## Roadmap after this phase (separate prompts and approvals)

- **Phase 2, invoice, remittance and certificates.** An invoice page per transaction (`/transactions/[id]/invoice`) with copy buttons, client-facing share text and an invoice PDF. Transaction detail shows amount payable, branch fee, "Branch sends you", and the remittance record (date, account, reference). A server-generated Certificate of Compliance PDF matching mobile's `certificateHtml`, with QR code and chairman signature from the private `signatures` bucket; owner-checked, and refused when revoked. QR codes and share links use one canonical `NEXT_PUBLIC_VERIFICATION_URL` (mobile uses `https://nba-mobile-app.vercel.app`) instead of the current origin, so web and mobile certificates resolve identically. Add a `/verify` page for typing in an RBIN.
- **Phase 3, installable and offline.** Web app manifest and icons, a service worker that caches the app shell and calculator, an offline banner, first-visit onboarding slides (mobile has three), a `typecheck`/`test` script in `package.json`, and a README update.
- **Already the same on both (not gaps):** Paystack is not wired on mobile either (entitlement must come from a server webhook). Notification preferences are local-only on mobile too.
