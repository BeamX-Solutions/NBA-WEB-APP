# Phase 2: invoice, remittance, certificates, verification

## Goal

Bring the web app level with the mobile app from invoice to certificate:

1. An invoice page per transaction: remuneration, branch bank details with copy buttons, client-facing share text, and an invoice PDF.
2. Transaction detail shows the money split (client pays, branch fee, branch sends you), the remittance record, and a confirmation before proof submission.
3. A Certificate of Compliance PDF generated on the server, following mobile's certificate design: QR code, chairman signature, REVOKED stamp.
4. One canonical verification URL for QR codes and links, so web and mobile certificates resolve to the same place.
5. A public `/verify` page where an RBIN can be typed in, accepting encoded and literal-slash forms, laid out like the mobile verify screen.
6. Phase 1 follow-ups: the membership migration is now deployed (the fallback comes out), and the membership and administrator screens are restyled to the mobile designs, as the user asked.

Branch: continue on `feat/mobile-parity-phase-1`, with no separate Phase 2 branch (user instruction). No database changes.

## Skills and docs read

- `AGENTS.md`, `.agents/skills/supabase/SKILL.md`: owner-scoped reads, private buckets, no service key.
- Next 16 docs: `output.md` (`outputFileTracingIncludes`, so server routes can read `public/fonts` and the seal when deployed), proxy, server actions.

## Code inspected

- Mobile:
  - Screens: `app/transaction/invoice/[id].tsx`, `app/transaction/[id].tsx`, `app/certificate/[id].tsx`, `app/verify/[rbin].tsx`, `app/(tabs)/transactions.tsx`.
  - Libraries: `lib/pdf.ts` (invoice and certificate templates), `lib/certificate.ts` (particulars, recital, note), `lib/verification.ts`, `lib/signature.ts`, `lib/branding.ts`.
  - Components: `components/ui/MembershipPending.tsx`, `components/ui/AdminWebOnly.tsx`.
- Web:
  - Transactions: `lib/transactions/{contracts,live-transaction}.ts`, `components/transactions/{transaction-detail,transactions-list}.tsx`.
  - Certificates: `lib/certificates/{data,contracts,types,verification,sample-certificate-pdf}.ts`, `app/certificates/[id]/{page.tsx,pdf/route.ts}`, `components/certificates/certificate-detail.tsx`.
  - Other: `app/verify/[rbin]/page.tsx`, `components/calculator/preview-flow.tsx`, and the Phase 1 gate pages.

## Deployed schema, verified read-only (30 Sep)

- `profiles.membership_status` and `membership_rejection_reason` exist. `resubmit_membership` exists (anon is denied with 42501, as intended).
- `branches.chairman_name`, `chairman_signature_url` and `logo_url` exist.
- The storage policy "authenticated users read signatures" lets a signed-in practitioner read the private `signatures` bucket.

## Decisions

1. **Invoice page** `/transactions/[id]/invoice` follows the mobile invoice screen:
   - Seal, branch name and product name at the top; rows for practitioner, reference, document type, parties and date.
   - A REMUNERATION block with the note "The branch keeps X and sends you Y".
   - "Pay into this account" with copy buttons for account name, account number, bank and reference, plus the reference notice. A warning replaces them when the branch has not published bank details.
   - Buttons: "My client has paid, upload proof", "Download PDF" and "Share invoice". Share uses the Web Share API with mobile's client-facing text, falls back to the clipboard, and ignores cancellation.
   - The loader is owner-scoped (`user_id = auth.uid()`) and reads the transaction's own branch (`branches!transactions_branch_id_fkey`), not the user's current branch.
2. **After invoice creation** the calculator sends the user to the invoice page, as mobile does. The inline success view is removed, so there is one invoice screen.
3. **Invoice PDF** `GET /transactions/[id]/invoice/pdf`: owner-checked, drawn on the server with `pdf-lib` from the stored transaction. It follows mobile's `invoiceHtml`: letterhead seal, "Invoice", reference and date, transaction rows, remuneration block, "Pay to" rows or a missing-details warning, the reference instruction and the Order footnote. A4, `Cache-Control: private, no-store`.
4. **Transaction detail** follows mobile:
   - Rows: "Client pays into branch account" (emphasised), "Less branch fee", "Branch sends you", and the RBIN when issued.
   - A "Your share" card once verified: the remittance date, account and reference, or "the branch will send ₦X" before it is recorded.
   - A confirmation dialog before "Submit for Verification", with mobile's wording. Mobile's copy for pending and verified states.
   - A "View invoice" link while awaiting payment or rejected.
   - The list card shows `amount_payable`, as mobile does.
5. **Certificate PDF** `GET /certificates/[id]/pdf` always generates from the database, as mobile does; `pdf_url` is null everywhere. The stored-URL path and `certificatePdfLocation` are removed.
   - Layout follows mobile `certificateHtml`: gold double frame on cream, corner flourishes, faint seal watermark, seals either side of "NIGERIAN BAR ASSOCIATION" and the branch, the rule / title / rule block, the lead and recital, six numbered particulars, the note with the verification host, date and certificate number, the QR code, and the chairman block with the signature image on the rule.
   - Revoked certificates download with a REVOKED band, as mobile does, instead of being refused. The detail page still marks them clearly.
   - The signature comes from the private `signatures` bucket through the user's own session. Any failure prints the name over an empty rule, never an error.
   - Owner-scoped through `loadCertificates(id)`.
6. **Canonical verification URL.** Add `NEXT_PUBLIC_VERIFICATION_URL`, defaulting to `https://nba-mobile-app.vercel.app`, the value in mobile's `.env.example` and the deployed console. `verificationUrlFor(rbin)` = `${base}/verify/${encodeURIComponent(rbin)}`, identical to mobile. The QR code, the link on the certificate page and the PDF all use it. Add it to `.env.example`.
7. **Public verification.**
   - Rename `app/verify/[rbin]` to `app/verify/[...rbin]` so `/verify/NBA%2F2026%2F00001` and `/verify/NBA/2026/00001` both resolve, as on the console. Decode each segment at most once, then join with `/`.
   - Add `app/verify/page.tsx`, which shows the empty form.
   - Layout follows mobile verify: seal, "Verify a Certificate", RBIN field with a Verify button (a GET form that navigates to `/verify/<encoded>`), then a result card: Genuine / Revoked with reason / No such certificate / register unreachable. Detail rows, the scope disclaimer and the footer attribution.
   - Still only the `verify_rbin` projection; parties and consideration are never shown. Stays outside the proxy matcher.
8. **Phase 1 follow-ups.**
   - Remove the 42703 fallback from `lib/practitioner/access.ts`.
   - Restyle `/membership` to `MembershipPending`: an 84px icon circle (hourglass, or error when rejected), a serif title, muted body, the reason box, the form, "Check again", an outline "Sign out" and the product footnote.
   - Restyle `/administrator-account` to `AdminWebOnly`: desktop icon, "Administrators use the web console", mobile's two paragraphs, Sign out, footnote.
   - One shared `GateScreen` component serves both.
9. **Shared PDF code.** `lib/pdf/assets.ts` reads the fonts and seal from `public/` on the server. `next.config.ts` adds `outputFileTracingIncludes` for the two PDF routes. The certificate wording (recital, note, particulars) lives in `lib/certificates/wording.ts`, used by both the page and the PDF, as mobile's `lib/certificate.ts` does.

## Files expected

- New:
  - `app/transactions/[id]/invoice/page.tsx`
  - `app/transactions/[id]/invoice/pdf/route.ts`
  - `components/transactions/invoice-view.tsx`
  - `lib/transactions/invoice.ts` (loader and types)
  - `lib/pdf/assets.ts`, `lib/pdf/invoice-pdf.ts`, `lib/pdf/certificate-pdf.ts`, plus tests
  - `lib/certificates/wording.ts`
  - `app/verify/page.tsx`
  - `components/verify/verify-view.tsx`
  - `components/membership/gate-screen.tsx`
- Changed:
  - Transactions: `lib/transactions/contracts.ts`, `live-transaction.ts`, `components/transactions/transaction-detail.tsx`, `transactions-list.tsx`
  - Calculator: `components/calculator/preview-flow.tsx`
  - Certificates: `app/certificates/[id]/page.tsx`, `app/certificates/[id]/pdf/route.ts`, `components/certificates/certificate-detail.tsx`, `lib/certificates/{contracts,data,types}.ts` and tests
  - Verification: `app/verify/[rbin]` moves to `app/verify/[...rbin]`
  - Gate pages: `lib/practitioner/access.ts` and test, `components/membership/membership-status.tsx`, `app/administrator-account/page.tsx`
  - Config: `next.config.ts`, `.env.example`

## Security

- All practitioner reads are filtered by `user_id = auth.uid()`; RLS still applies.
- The PDF routes check ownership before drawing and never accept figures from the client.
- Signed signature URLs are short-lived, used on the server only and never returned to the browser.
- The public verification page uses only `verify_rbin`, with an anon client and no session.
- No new buckets, policies, service keys or writes.
- The Web Share and clipboard text contains only what the practitioner already shares with their own client.

## Acceptance criteria

- After creating an invoice the user lands on `/transactions/<id>/invoice` with the correct branch account, reference and amounts. Copy buttons work; share works or falls back to the clipboard.
- The invoice PDF downloads as a one-page A4 document with the same figures. Another user's transaction id returns 404.
- Transaction detail shows the split, the remittance state and the confirmation step; proof submission still works.
- The certificate PDF downloads for owned certificates, with the QR code pointing at `https://nba-mobile-app.vercel.app/verify/<encoded RBIN>`. A revoked one carries REVOKED; one without a signature still renders.
- `/verify`, `/verify/NBA%2F...` and `/verify/NBA/...` all work signed out and show no parties or consideration.
- Pending and rejected members see the mobile-style membership screen; administrators see the mobile-style console screen.
- No regressions: type check, lint, tests and build pass.

## Checks

`npx next typegen`, `npx tsc --noEmit`, `npm run lint`, `node --test "lib/**/*.test.ts"` (with new tests for verification URLs, RBIN segment joining, and a PDF render of each document checked for A4 and one page), `npm run build`, and a signed-out smoke test of `/verify` routes and the PDF routes (expecting a redirect to login).

## Execution record

Implemented on `feat/mobile-parity-phase-1` after the user said not to branch. Not committed.

- Membership fallback removed. An unknown `membership_status` is now "unavailable" (let through to the page, refused by the database) rather than "approved".
- New `lib/pdf/` holds the drawing kit, assets, invoice and certificate. Sample renders were inspected visually against mobile's templates; that caught one overprinting bug in wrapped text, now fixed.
- The certificate PDF is always generated. Revoked certificates get a REVOKED band; the signature comes from the `signatures` bucket through the user's session. `certificatePdfLocation`, `pdf_url` handling and `decodeRbinSegment` were removed (replaced by `rbinFromSegments`).
- After invoice creation the calculator goes to `/transactions/<id>/invoice`. The server action no longer re-reads stored amounts.
- Also changed: the certificates list share link uses the canonical verification URL (it used the current origin). Added `components/ui/confirm-dialog.tsx` and `lib/branding.ts`.
- Checks:
  - `npx tsc --noEmit` passed, after deleting a stale `.next/dev/types` file that referenced the old `[rbin]` route.
  - `npm run lint` passed.
  - `node --test "lib/**/*.test.ts"` gave 77/77.
  - `npm run build` passed with no tracing warnings, after `lib/pdf/assets.ts` switched to literal paths.
- Signed-out smoke test on `next dev`:
  - `/verify` returns 200 with the form.
  - `?rbin=` redirects (307) to the encoded URL.
  - The encoded and literal-slash RBIN routes both return 200 with "No such certificate", so they reach `verify_rbin`.
  - The invoice page, both PDF routes, `/membership` and `/administrator-account` redirect (307) to login.
- Not run: every signed-in step (no test account here), QR scanning, Web Share on a phone, and responsive checks.

## Manual test steps

1. Create an invoice from the calculator and confirm you land on the invoice page with the right amounts and bank details.
2. Press each copy button and paste to confirm. Share (on a phone browser) and on desktop confirm the clipboard fallback message.
3. Download PDF on the invoice and check it is one A4 page with the figures shown on screen.
4. "My client has paid, upload proof": the transaction page shows the split. Choose a file, confirm the dialog appears, cancel, then submit.
5. On a verified transaction, confirm the "Your share" card: remittance recorded or pending.
6. Open a certificate and download the PDF. Check the particulars, chairman name and signature (if uploaded), and scan the QR code with a phone: it opens the console's verify page.
7. Signed out, open `/verify`, type an RBIN, and open both `/verify/NBA%2F...` and `/verify/NBA/...`.
8. Sign in as a pending member, then as an administrator, and compare both screens with the mobile app.
9. Check the invoice, transaction and verify pages at 375px, 768px and desktop widths.
