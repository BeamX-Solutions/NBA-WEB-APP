# Implementation Prompt: NBA Legal Fees Practitioner Design System Page

## Goal

Implement a production-quality, reusable NBA Legal Fees Practitioner design system inside the repository, then replace the default Next.js starter homepage with a responsive overview that demonstrates and consumes that real system. The overview must closely reproduce the supplied desktop reference at `design/ChatGPT Image Sep 22, 2026, 07_14_02 PM.png`.

The result must not be a one-off mock page. Institutional tokens, typography, buttons, badges, cards, fields, layout rules, elevations, and feedback states must be defined centrally and exposed through reusable typed components suitable for later practitioner screens. The overview page should prove those primitives work by using them throughout.

## Skills and guidance read

- `vercel:nextjs`
  - Use current Next.js 16 App Router conventions.
  - Keep the page server-rendered unless a small interactive island is actually required.
  - Use `next/image` for raster assets and `next/font` for optimized typography.
- `vercel:agent-browser-verify`
  - After starting the dev server, verify that the page loads, contains meaningful content, has no framework error overlay, has no console errors, and renders expected interactive elements.
- Project `AGENTS.md`
  - The supplied screenshot is the visual source of truth.
  - Adapt sensibly for mobile because only a desktop reference was provided.
  - Avoid unrelated refactors and run the smallest relevant checks.

No additional skill installation is needed. This task does not touch Supabase, PostgreSQL, authentication, payments, or other data-backed product flows, so the Supabase skills are not applicable.

## Existing code inspected

- `package.json`: Next.js `16.3.6`, React `19.2.8`, Tailwind CSS `4`, TypeScript, and ESLint; no icon or component library is installed.
- `app/page.tsx`: untouched Create Next App starter screen.
- `app/layout.tsx`: default Geist and Geist Mono font setup with starter metadata.
- `app/globals.css`: minimal Tailwind import, starter color variables, and automatic dark-mode override.
- `next.config.ts`: default configuration.
- Current Next.js 16 local documentation for `next/font` and `next/image`.
- Reference image: a 2048px-wide desktop design-system page with a slim global header, fixed documentation sidebar, hero, four summary metrics, color tokens, typography/rhythm/elevation panels, component specimens, living cards, code sample, and footer.

## Decisions and assumptions

- Build the supplied design-system overview as the root route `/`.
- Preserve the reference's information architecture and visual density while changing the primary identity from “Lex Pro” to “NBA Legal Fees Practitioner.”
- Use the screenshot as a visual reference, not as a full-page image or embedded facsimile. The DOM must contain real semantic text, controls, cards, and navigation.
- Build with React, TypeScript, Tailwind utilities, CSS custom properties, and focused global styles. Do not add a UI framework or icon dependency.
- Create a real design-system layer with one authoritative token definition for colors, type, spacing, radii, borders, and shadows. CSS variables used by Tailwind and typed TypeScript token exports must stay aligned; avoid scattering repeated literal values through the page.
- Create reusable, typed UI primitives instead of embedding button/badge/card/input markup directly in the overview. Variants must be explicit and composable.
- Use lightweight inline SVG icon components with accessible semantics where appropriate.
- The architectural hero artwork may use a locally created, optimized decorative asset derived from the supplied visual reference only if needed for fidelity; it must not contain baked-in page UI or text. Otherwise use a deliberate CSS/SVG architectural treatment.
- Keep all current presentation data local and typed. No API, Supabase, or persistence work is required.
- Desktop should match the reference closely at approximately 1440–2048px wide. Tablet should compress the two-column content. Mobile should remove the persistent sidebar, allow horizontal top navigation where needed, stack cards, and retain all meaningful content.
- All controls demonstrated as interactive must work locally: section navigation scrolls to content, search filters/navigates the documented specimens, copy controls write their intended value, token export downloads a generated JSON file, and demo action buttons expose clear local feedback without pretending to perform a financial or server-side operation.
- Component states shown in the reference must be genuine states of the reusable primitives: hover, focus-visible, active, disabled, processing/loading, destructive, success, warning/pending, neutral, and error where applicable.
- Remove the starter dark-mode override because the supplied design is explicitly light and institutional.
- Preserve unrelated user changes. Do not modify `AGENTS.md`, `.agents/`, `skills-lock.json`, or other dirty/untracked files outside this task.

## Expected files to touch

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- Focused design-system tokens/types under a clearly named local module such as `lib/design-system/`
- Reusable primitives under a clearly named component directory such as `components/ui/`
- Overview-specific composed sections under `components/design-system/`
- Optional decorative image asset under `public/`

## Functional requirements

1. Global header
   - Circular NBA-style seal mark and two-line product label.
   - Reusable search/input field with keyboard hint styling.
   - Search must filter or jump to matching components/tokens and expose an intentional no-results state.
   - Overview, Foundations, Components, Patterns, and Resources navigation.
   - Circular practitioner avatar.
2. Left documentation navigation
   - Architecture, Design Tokens, and Component Library groups.
   - Active Overview item in authority green.
   - Sticky desktop behavior contained below the header.
3. Hero
   - Version badge, Nigerian Bar Association badge, and updated date.
   - NBA Legal Fees Practitioner heading and concise product description.
   - Primary and secondary reusable button variants plus a working token-export action.
   - Architectural/legal-institution visual with a dark caption strip.
4. Foundation summary
   - Four metric cards for primary color, typography, spacing baseline, and accessibility.
5. Color-system panel
   - Primary greens, judicial golds, neutral surfaces, and error tones.
   - Each swatch shows a semantic token name, hex value, and useful contrast/role text.
   - Swatches are generated from the authoritative token source and can copy the token name or value with visible feedback.
6. Typography, rhythm, and elevation
   - Legal-content type specimens matching the reference hierarchy.
   - 4px rhythm bars and labels.
   - Three institutional shadow/elevation samples.
7. Component showcase
   - Reusable button primitive with primary, secondary, tertiary/ghost, destructive, disabled, icon-leading, and loading/processing examples.
   - Reusable badge/status primitive with success, warning/pending, danger/deferred, neutral, verification, and SAN-style examples.
   - Reusable input/search primitive with label, helper/error text, disabled state, and accessible error association.
   - Reusable surface/card primitive used by all specimen panels rather than duplicated card styles.
8. Living specimen cards
   - Practitioner credential card.
   - Legal-fee calculation/remittance card.
   - Compliance/adoption card with circular progress treatment.
9. Code token panel
   - Dark syntax-styled code block sourced from the real token definitions.
   - Preset selector and working copy control with an accessible copied state.
10. Footer
   - NBA Digital Directorate identity and compact policy/resources links.

## Reusable design-system requirements

1. Tokens
   - Define semantic colors rather than page-specific names: primary, primary-container, on-primary, secondary/judicial gold, surfaces, ink, muted ink, border, success, warning, destructive, and focus ring.
   - Define spacing on a 4px base scale, type sizes/line heights/weights, radii, borders, and three elevation levels.
   - Expose tokens through CSS custom properties usable by Tailwind and through a typed TypeScript object used by the overview/export tools.
   - Generate token swatches, rhythm examples, elevation examples, and exported JSON from the centralized token values.
2. `Button`
   - Typed variants and sizes; supports leading/trailing icons, full-width mode, disabled state, and accessible loading state.
   - Uses native button/link semantics appropriately and forwards standard element attributes.
3. `Badge` or `StatusBadge`
   - Typed tone/variant mapping with optional icon and readable status label.
4. `Card`
   - Shared surface, border, radius, padding, and elevation variants with semantic composition rather than monolithic card props.
5. `Input`/`SearchField`
   - Real label support, hint/error messaging, `aria-invalid`, disabled state, and keyboard shortcut presentation.
6. Feedback utilities
   - A small accessible live-feedback pattern for copy/export/demo actions.
   - Avoid introducing a toast dependency for this scope; use a focused in-repo implementation.
7. Composition
   - The overview, summary metrics, specimen cards, and controls must consume these primitives and tokens. Avoid parallel one-off styles that visually imitate the system without using it.

## Visual and responsive requirements

- Use the reference palette: deep NBA forest green, judicial gold, off-white paper, pale green surfaces, dark ink, restrained red, and subtle gray borders.
- Match the reference's compact spacing, small labels, fine borders, modest radii, and low-opacity shadows.
- Keep the main canvas centered with a wide maximum width; do not stretch sections indefinitely on very wide screens.
- Use a clear type hierarchy with optimized local/self-hosted font loading through `next/font`.
- Avoid arbitrary visual embellishment that is absent from the reference.
- At mobile widths:
  - Keep the header compact and allow the section navigation to scroll or collapse without JavaScript-heavy behavior.
  - Hide the persistent left sidebar and expose its destinations through the top/section navigation.
  - Stack the hero, summary cards, foundation panels, component specimens, and living cards.
  - Avoid clipped text, horizontal page overflow, and controls smaller than comfortable touch targets.
- Honor reduced-motion preferences and keep hover/focus treatments restrained.

## Accessibility requirements

- Semantic landmarks: header, navigation, main, sections, and footer.
- One descriptive `h1`, then ordered section headings.
- Visible `:focus-visible` states for every interactive element.
- Accessible names for icon-only controls and decorative icons hidden from assistive technology.
- Sufficient foreground/background contrast for body copy and controls; token swatches may display their measured/example contrast values without allowing low-contrast essential text.
- Search must have a real accessible label.
- Copy/export result messages must be announced through an `aria-live` region without unexpectedly moving focus.
- Loading buttons must expose `aria-busy` and retain a stable accessible name.
- Do not rely on color alone to communicate button or status state.

## Security and privacy considerations

- Do not introduce external scripts, trackers, remote runtime font requests, or third-party embeds.
- Do not add secrets, environment variables, database access, authentication assumptions, or untrusted HTML rendering.
- Keep demo practitioner and fee values clearly static and non-sensitive.
- Any outbound placeholder actions should remain inert or use safe local anchors; do not create misleading transaction behavior.
- Serialize only the static allow-listed design tokens for download; do not serialize runtime/environment data.
- Clipboard support must have a safe fallback/error state and must not read existing clipboard contents.

## Acceptance criteria

- `/` no longer shows Create Next App content.
- At desktop width, the page visibly matches the reference's overall composition, proportions, hierarchy, palette, card density, and component arrangement.
- All listed sections and specimen content are present as real HTML.
- Tokens are centrally defined and drive the CSS theme, rendered token documentation, code sample, and downloaded token JSON.
- Reusable typed `Button`, `Badge`/`StatusBadge`, `Card`, and `Input`/`SearchField` components exist and are consumed by the overview.
- Search, internal navigation, token copy, code copy, and JSON token export work in the browser with accessible feedback.
- Demonstrated disabled/loading/status states are implemented component states, not merely captions or static lookalikes.
- The layout is coherent and usable at representative mobile, tablet, and desktop widths.
- There is no horizontal document overflow at 375px.
- Metadata names NBA Legal Fees Practitioner and describes the product accurately.
- No new runtime dependency is required unless an unexpected implementation constraint is discovered and separately approved.
- TypeScript/build and ESLint checks pass.
- Browser verification shows meaningful content, no Next.js error overlay, and no console errors.

## Checks to run

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`
4. Start `npm run dev` and perform browser verification.
5. Inspect rendered screenshots at 375x812, 768x1024, and 1440x1200 (plus a full-page desktop capture for comparison).
6. Check for page overflow with `document.documentElement.scrollWidth === document.documentElement.clientWidth` at mobile width.
7. Check for a Next.js error overlay and console errors.
8. Run focused interaction checks for search/filtering, section navigation, copy feedback, token JSON export, disabled controls, and loading-state accessibility.

## Exact manual test steps

1. Run `npm run dev` and open `http://localhost:3000`.
2. At 1440px width, compare the page against the supplied reference from top to bottom.
3. Confirm the header, left navigation, hero, four metric cards, color tokens, type/rhythm/elevation panels, component showcase, living cards, code tokens, and footer are all visible.
4. Use Tab from the address bar and confirm every link/button/search control receives a visible focus indicator in a logical order.
5. Activate Overview, Foundations, and Components links and confirm they land on the intended page sections.
6. Search for `button`, `color`, and a deliberately missing term; confirm matching content is discoverable and the missing term produces a useful no-results state.
7. Copy a color token and the code sample; confirm the value is written and an accessible copied message appears.
8. Export tokens; confirm a JSON file downloads and contains the documented color, spacing, typography, radius, and elevation keys—without unrelated application data.
9. Exercise primary, secondary, destructive, disabled, and loading button examples; confirm disabled controls do not activate and loading state is announced.
10. Inspect the input examples and confirm labels, hints, disabled state, and error association are exposed correctly.
11. Resize to 768x1024 and confirm content compresses without overlap, cropped labels, or unreadable cards.
12. Resize to 375x812 and confirm the left sidebar is not consuming viewport width, all content stacks, controls remain usable, and the page has no horizontal scrollbar.
13. Confirm the browser console has no errors and no Next.js error overlay appears.
14. Refresh `/` directly and confirm the page renders identically without client-only loading gaps.
