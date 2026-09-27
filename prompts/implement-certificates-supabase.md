# Implement certificates using existing Supabase contracts

## Goal and constraints

Replace sample data in the certificates list and detail with the authenticated practitioner's issued certificates. Complete sharing and QR/public verification using existing backend contracts. Preserve the current UI layout, spacing, typography, colors, breakpoints, shell, card shapes and controls. Only update functional copy/status labels and render necessary states with existing design-system components. Supabase is strictly read-only: no schema, data, policies, buckets, functions, issuance, revocation or settings changes.

Create a new feature branch after approval. Do not implement before this prompt is approved.

## Skills and documentation read

- `.agents/skills/supabase/SKILL.md`: session-scoped reads, RLS, external-data validation and private credentials.
- Installed `vercel:nextjs` skill: App Router and server/client boundaries.
- Installed Next.js 16.3.6 guides in `node_modules/next/dist/docs/`: fetching data, error handling and dynamic routes. Use async route params and cookies; keep expected errors as typed results.
- Supabase JavaScript select documentation: https://supabase.com/docs/reference/javascript/select . The changelog markdown could not be retrieved with the web reader (unsupported content type); shell retrieval was blocked by unavailable DNS. Retry documentation access as needed before implementation. No new skills or dependencies are currently required.
- Read the installed React best-practices skill after editing multiple TSX files. Read browser verification guidance if starting a dev server.

## Code inspected

- `AGENTS.md`, `package.json`, clean working-tree status.
- `app/certificates/page.tsx`, `app/certificates/[id]/page.tsx`, `app/verify/[rbin]/page.tsx`.
- `components/certificates/certificates-list.tsx`, `components/certificates/certificate-detail.tsx`.
- `lib/certificates/sample-certificates.ts` and sample PDF references.
- `lib/supabase/server.ts`, `lib/transactions/live-transaction.ts`, `lib/profile/data.ts`.
- Transaction route error/auth patterns and `components/ui/form-notice.tsx`.

The current certificates routes use hardcoded samples, sample share URLs and a sample PDF generator. The public verification route is a placeholder. Reuse the existing cookie-scoped server Supabase client and FormNotice.

## Deployed contracts verified in dashboard, read-only

Project: NBA Mobile App, `ygefmmotolfrqnbmtljg`.

- `certificates`: UUID `id`, UUID `transaction_id` (unique foreign key to transactions), required `certificate_number`, required `issued_at`; nullable `pdf_url`, `emailed_at`, `revoked_at`, `revocation_reason`; `created_at`, `updated_at`.
- Three existing certificates were visible. All three have null `pdf_url`. The first two use `NBA/AN/CC/2026/...` certificate numbers; a legacy certificate uses `NBA-CC-2026-0001`. Do not derive or validate identifiers against one invented numbering format.
- `transactions`: `id`, `user_id`, `branch_id`, `parties`, `document_type`, bigint `consideration`, `status`, nullable `rbin` and `rbin_issued_at`, plus existing financial/proof fields. Transaction foreign keys point to profiles and branches.
- `branches`: `name`, `branch_code`, `short_code`, nullable `chairman_name`, `chairman_signature_url`, `logo_url`, plus existing branch fields. Read the actual transaction branch, not the user's current branch. Never hardcode sample chairman identity.
- Certificates have RLS enabled. The owner SELECT policy requires an existing transaction where `t.id = certificates.transaction_id AND t.user_id = auth.uid()`. Other SELECT policies serve branch/super administrators. Explicitly scope practitioner queries to the authenticated user even if their role allows wider access.
- Existing SQL `verify_rbin(p_rbin text)` is read-only: SELECT joins transactions, profiles, branches and certificates; filters `t.rbin = upper(trim(p_rbin))` and `t.status = 'verified'`.
- Its result columns: `found`, `rbin`, `practitioner_name`, `scn`, `document_type`, `branch_name`, `issued_at`, `certificate_number`, `revoked`, `revocation_reason`. No match returns no rows. Do not query private transaction details to implement public verification.

Function/policy inspector dialogs were closed with Cancel; no save action was used.

## Implementation decisions

1. Add explicit certificate types and runtime parsing helpers. Validate identifiers, dates, numeric consideration and expected nested relation shapes. Reuse existing document-type labels/formatting where possible. Never silently replace malformed data with a sample certificate.
2. Add a server-only loader authenticated with `auth.getUser()`. Redirect unauthenticated private routes to login with their return path. Query certificates with an inner transaction relationship and explicit transaction ownership filter; select only needed columns, newest issued first. Load the owner's full name/SCN and actual transaction branch metadata. Disambiguate relationship foreign keys where necessary. Do not cache practitioner data across users.
3. Pass validated records and expected errors into the existing list component. Retain grid/list switching and existing cards. Replace sample badges/copy with issued/revoked and PDF availability labels in the same slots. Show meaningful empty, loading and retryable error states. Errors use FormNotice, friendly copy and no raw database messages.
4. Load details by real certificate UUID with the same ownership constraint. Invalid/missing/other-user IDs must not reveal data. Provide a friendly unavailable state/back link using existing UI components; distinguish fetch failure from missing record.
5. Preserve the detail's certificate layout and read fields from actual data. Show revocation explicitly; do not imply a revoked certificate remains valid. Missing optional chairman metadata uses honest unavailable text rather than the sample identity.
6. QR and share links use the existing `/verify/${encodeURIComponent(rbin)}` contract and the current origin. Share the public verification link with native sharing or clipboard fallback; handle cancellation quietly and failures with FormNotice.
7. Wire `/verify/[rbin]` to the existing read-only `verify_rbin` RPC with a public/publishable-key client and no private table fallback. Validate/normalize input, handle encoded slashes without double decoding, and distinguish found, revoked, not found and unavailable states. Keep the existing public page's visual structure; use existing notices and existing typography for public-safe metadata. Never serialize parties, consideration, proof paths, emails, phone numbers or private transaction IDs into public responses.
8. Download only an existing authoritative PDF, if a usable `pdf_url` is supplied by the backend. All current records lack one: show an explanatory information notice and disable the existing download control with appropriate availability copy. Do not generate an official-looking document from the sample generator. If a future PDF URL is usable, validate its scheme/origin and preserve storage authorization. Do not introduce arbitrary server-side URL fetching or guessed storage paths. Recheck ownership/revocation for any server download endpoint if one is needed. If the stored URL contract cannot be verified, fail safely with a friendly unavailable message and document the limitation.
9. Retain sample fixtures/PDF tests outside live routes to avoid unrelated refactors. No calculator, transaction creation, auth UI, global CSS or database changes.

## Expected files

- `app/certificates/page.tsx`, `app/certificates/[id]/page.tsx`.
- Certificate route loading/error/not-found files as needed.
- `components/certificates/certificates-list.tsx`, `components/certificates/certificate-detail.tsx`.
- New `lib/certificates/types.ts`, `contracts.ts`, server-only `data.ts`, public verification helper and focused contract tests as needed.
- `app/verify/[rbin]/page.tsx`.
- A certificate download route only if justified by a verified existing URL contract.

## Security

Use session-scoped publishable/anon client credentials only. Do not read/export service-role keys or dashboard tokens. RLS remains unchanged. Never call issuance/revoke/restore RPCs or perform writes. Validate all external data. Keep private particulars on owner-only routes. Public verification uses only the established RPC projection. No privileged bypasses, public buckets or invented entitlements. PDFs absent in storage must remain absent; do not upload generated files.

## Acceptance criteria

- Signed-in practitioners see only their real certificates, ordered by issue date.
- No production certificate route falls back to hardcoded samples.
- Existing layout and responsive design remain unchanged.
- Detail shows actual lawyer, SCN, document, branch, parties, consideration, RBIN, issue date and certificate number.
- Revoked certificates are clearly marked and cannot be downloaded as valid.
- Empty, malformed-data, loading, network, auth, missing-record, QR and share errors are handled intentionally in the existing design system.
- QR/share verification links work with RBINs containing slashes and with legacy identifiers.
- Public verification shows authoritative valid/revoked/not-found states and excludes private particulars.
- Current null PDF URLs produce an honest unavailable state; no sample PDF is offered as issued.
- Supabase has no mutations or configuration changes.

## Checks

- `npx tsc --noEmit` (no typecheck script exists).
- `npm run lint`.
- Focused meaningful contract tests using the project's existing Node test convention; cover malformed data, revoked records, null PDF URLs, UUID validation, RBIN normalization and privacy projection.
- `npm run build`; report environmental failures accurately.
- Existing certificates/PDF tests remain passing where runnable. No database migration tests are needed because database changes are prohibited.
- Read-only end-to-end browser verification against the existing signed-in session. Do not create, issue, revoke or modify records to test.

## Exact manual test steps

1. Sign in with an existing practitioner account, open `/certificates`, and compare visible IDs/count/order with that account's existing records.
2. Toggle Grid and List; open each certificate and compare fields against its existing transaction/branch/profile.
3. Refresh the detail URL and navigate back. Test an invalid UUID, missing UUID and an existing other-user certificate ID; confirm no private details leak.
4. For current records without a PDF, confirm the download control is unavailable and the app explains why; no sample file downloads.
5. Share a certificate, then open the resulting public `/verify/...` link in a signed-out browser. Confirm QR target matches that URL and no parties/consideration appear in markup or network responses.
6. Open an unknown RBIN and a malformed RBIN. If an already-revoked record exists, verify its status; otherwise report revocation browser testing unavailable and cover parsing via tests without database writes.
7. Use an existing account with no certificates if available; otherwise test the empty-state rendering locally without inserting rows.
8. Disable networking locally/restore it to inspect error and retry behavior; verify notices match FormNotice styling. Cancel native sharing and test clipboard fallback/failure.
9. Inspect desktop, tablet and mobile widths; preserve original layout and check long RBIN wrapping. Check installed PWA if available and report if unavailable.
10. Visit a private certificate route while signed out; confirm login return-path behavior. Public verification remains accessible without login.

## Known limitations to report

The backend currently supplies no PDF URLs, so stored official PDF download cannot be exercised with the visible records. Do not change Supabase to resolve this. Browser tests requiring unavailable accounts/records or installed-PWA state must be reported rather than claimed.

## Execution and verification record

Implemented on `feat/certificates-supabase` after approval.

- Used the installed React best-practices checklist to review server/client boundaries, independent-query parallelism, effect cleanup, keyboard focus and accessible notices. The browser automation CLI is not installed; verification used the existing native Zen browser session through computer-use tools.
- Retrieved the Supabase changelog through https://supabase.com/changelog and reviewed the JavaScript select/RPC documentation. No relevant breaking change required an application adjustment.
- Real session-scoped certificate queries returned the three deployed records. Detail uses actual document types (including Mortgage Deed), branch metadata, private transaction particulars, profile identity and issue metadata.
- Public verification uses an anonymous client and the existing SELECT-only `verify_rbin` RPC. Verified the issued record in a separate private browser window with no practitioner session; the private certificates list redirected to `/login?next=%2Fcertificates`.
- Next.js preserved encoded slash segments in the observed route params. Added one-time RBIN segment decoding with tests for already-decoded, encoded, malformed and double-encoded inputs. No double decoding occurs.
- Checked Grid/List switching, three-record ordering, real certificate detail, QR rendering/link, clipboard share success, missing UUID and invalid sample identifier notices, unknown RBIN and signed-out access.
- Inspected list/detail at desktop, 375px mobile and 768px tablet widths. Retained existing layout classes and colors; added only functional notices, status copy and long-RBIN wrapping. Removed the redundant NBA prefix when the actual branch name already includes it.
- TypeScript (`npx tsc --noEmit`), lint (`npm run lint`), seven focused certificate/sample-PDF tests and `git diff --check` passed.
- Default `npm run build` failed because Turbopack could not bind its worker port (`Operation not permitted`), including an escalated retry. The supported alternative `npm run build -- --webpack` passed, including compilation, TypeScript and route generation after the final fixes. No build configuration was changed.
- All observed certificate PDF URLs remain null. PDF-unavailable information and disabled downloads were verified. A future same-project Storage URL is resolved through an authenticated, ownership-checked read-only download route; arbitrary external URLs and unknown path contracts are rejected. A live official PDF download could not be exercised.
- Revoked-record display/parser behavior is covered by contract tests; no revoked fixture was inserted. Empty-account, other-user live record, native-share cancellation, induced Supabase network failure, console inspection and installed-PWA tests were not exercised because those sessions/records/tools were not available in this verification. No claims are made for those checks.
- No Supabase writes, function/policy saves, issuance/revocation calls, uploads or settings changes were performed.
