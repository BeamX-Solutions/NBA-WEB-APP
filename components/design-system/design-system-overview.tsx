"use client";

import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertIcon,
  ArrowIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  GridIcon,
  LocationIcon,
  ScaleIcon,
  SearchIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import {
  colorTokenDescriptions,
  designTokenCssVariables,
  designTokens,
  serializeDesignTokens,
  type ColorTokenName,
} from "@/lib/design-system/tokens";

const NAV_GROUPS = [
  { label: "Architecture", links: [["Overview", "overview"], ["Brand & Identity", "brand"], ["Accessibility", "accessibility"]] },
  { label: "Design tokens", links: [["Color System", "colors"], ["Typography", "typography"], ["Spacing & Layout", "spacing"], ["Elevation & Depth", "elevation"]] },
  { label: "Component library", links: [["Buttons & Actions", "components"], ["Input Fields", "input-fields"], ["Cards & Surfaces", "living-cards"], ["Fee Calculator UI", "fee-calculator"]] },
] as const;

const SEARCH_ITEMS = [
  { label: "Institutional color tokens", detail: "Foundations", id: "colors", terms: "color green gold surface error tokens" },
  { label: "Typographic hierarchy", detail: "Foundations", id: "typography", terms: "type font heading body label" },
  { label: "Spacing and 4px rhythm", detail: "Foundations", id: "spacing", terms: "spacing layout grid baseline" },
  { label: "Elevation and shadows", detail: "Foundations", id: "elevation", terms: "depth card shadow" },
  { label: "Buttons and actions", detail: "Components", id: "components", terms: "button primary destructive loading disabled" },
  { label: "Status badges", detail: "Components", id: "status-badges", terms: "badge status pending verified danger" },
  { label: "Input fields", detail: "Components", id: "input-fields", terms: "input search field error disabled" },
  { label: "Practitioner credential card", detail: "Patterns", id: "living-cards", terms: "card practitioner profile scn" },
  { label: "Legal fee calculator", detail: "Patterns", id: "fee-calculator", terms: "fee calculation remittance transaction" },
] as const;

const PRIMARY_TOKENS: ColorTokenName[] = ["primary", "primaryContainer", "primaryStrong", "primaryTint", "primaryDim"];
const GOLD_TOKENS: ColorTokenName[] = ["secondary", "secondaryContainer", "secondaryTint", "goldDim"];
const SURFACE_TOKENS: ColorTokenName[] = ["surface", "surfaceContainer", "inverseSurface", "destructive", "destructiveContainer"];

const TOKEN_CODE = `// NBA Legal Fees Practitioner — design tokens
export const tokens = {
  color: {
    primary: "${designTokens.color.primary}",       // NBA Institutional Forest
    secondary: "${designTokens.color.secondary}",     // Judicial Gold
    surface: "${designTokens.color.surface}",       // Neutral paper
    destructive: "${designTokens.color.destructive}",  // Sanctions / fees
  },
  spacing: { micro: "${designTokens.spacing.micro}", xs: "${designTokens.spacing.xs}", md: "${designTokens.spacing.md}" },
  radius: { small: "${designTokens.radius.small}", medium: "${designTokens.radius.medium}", large: "${designTokens.radius.large}" },
} as const;`;

type Feedback = { message: string; tone: "success" | "danger" } | null;

async function writeClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

function NbaSeal({ compact = false }: { compact?: boolean }) {
  return <span className={`nba-seal ${compact ? "nba-seal--compact" : ""}`} aria-hidden="true"><span className="nba-seal__ring"><ScaleIcon size={compact ? 11 : 15} /></span></span>;
}

function ArchitectureArtwork() {
  return (
    <div className="architecture-art" role="img" aria-label="Stylised Nigerian judicial registry colonnade">
      <div className="architecture-art__sky" />
      <div className="architecture-art__building">
        <div className="architecture-art__roof" />
        <div className="architecture-art__arches">{[0, 1, 2, 3].map((arch) => <span className="architecture-art__arch" key={arch} />)}</div>
        <div className="architecture-art__seal"><ScaleIcon size={24} /></div>
      </div>
      <div className="architecture-art__palm architecture-art__palm--left" />
      <div className="architecture-art__palm architecture-art__palm--right" />
      <div className="architecture-art__caption"><LocationIcon size={14} />Federal Republic of Nigeria · Judicial Registry</div>
    </div>
  );
}

function SectionHeading({ description, icon, title }: { description: string; icon?: React.ReactNode; title: string }) {
  return <div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div>{icon ? <span className="section-heading__icon">{icon}</span> : null}</div>;
}

function TokenSwatch({ name, onCopy }: { name: ColorTokenName; onCopy: (name: ColorTokenName) => void }) {
  const value = designTokens.color[name];
  const darkBackground = ["primary", "primaryContainer", "primaryStrong", "secondary", "inverseSurface", "destructive"].includes(name);
  return (
    <button className={`token-swatch ${darkBackground ? "token-swatch--dark" : ""}`} onClick={() => onCopy(name)} style={{ backgroundColor: value }} title={`Copy ${name}: ${value}`} type="button">
      <span className="token-swatch__name">{name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}</span>
      <strong>{value}</strong><small>{colorTokenDescriptions[name]}</small><CopyIcon className="token-swatch__copy" size={13} />
    </button>
  );
}

function TokenRow({ names, onCopy, title, tone }: { names: ColorTokenName[]; onCopy: (name: ColorTokenName) => void; title: string; tone: "green" | "gold" }) {
  return <div className="token-row"><p className={`token-row__label token-row__label--${tone}`}>{title}</p><div className={`token-grid token-grid--${names.length}`}>{names.map((name) => <TokenSwatch key={name} name={name} onCopy={onCopy} />)}</div></div>;
}

function MetricCard({ label, meta, value }: { label: string; meta: string; value: string }) {
  return <Card className="metric-card" padding="compact"><span>{label}</span><div><strong>{value}</strong><Badge tone="neutral">{meta}</Badge></div></Card>;
}

function DemoLabel({ children }: { children: React.ReactNode }) {
  return <span className="demo-label">{children}</span>;
}

function PractitionerCard() {
  return (
    <Card as="article" className="living-card" padding="compact">
      <div className="living-card__eyebrow"><span>Credential card</span><Badge tone="success">Verified</Badge></div>
      <div className="practitioner"><span className="practitioner__avatar">OA</span><div><strong>Olumide Akpata</strong><small>SCN 04219 · Lagos Branch</small></div></div>
      <dl className="facts"><div><dt>Year of Call</dt><dd>1993</dd></div><div><dt>Practicing Since</dt><dd>2025</dd></div><div><dt>Branch Level</dt><dd>Compliant</dd></div></dl>
      <Button fullWidth iconTrailing={<ArrowIcon />} size="small" variant="secondary">Inspect Digital Signature</Button>
    </Card>
  );
}

function FeeCard({ onAction }: { onAction: () => void }) {
  return (
    <Card as="article" className="living-card living-card--fee" padding="compact">
      <div className="living-card__eyebrow"><span>Live calculation KPI</span><ScaleIcon className="gold-icon" /></div><small>Computed Legal Fee (NBA Doc 2023)</small>
      <strong className="fee-total">₦ 3,450,000<sup>.00</sup></strong>
      <dl className="facts"><div><dt>Property Consideration</dt><dd>₦ 24,500,000</dd></div><div><dt>Scale Percentage Band (R)</dt><dd>10.0%</dd></div><div><dt>NBA Stamp & Verification</dt><dd>₦ 5,000</dd></div></dl>
      <Button fullWidth onClick={onAction} size="small">Generate Official Remittance</Button>
    </Card>
  );
}

function AdoptionCard() {
  return (
    <Card as="article" className="living-card adoption-card" padding="compact">
      <div className="living-card__eyebrow"><span>Statutory compliance</span><span>NBA Ecosystem</span></div>
      <div className="progress-ring" aria-label="126 of 213 registered NBA branches onboarded" role="img"><div><strong>126</strong><span>Activated</span></div></div>
      <strong>Nationwide Seal Adoption</strong><small>126 of 213 registered NBA branches onboarded to Legal Fees v1.2</small><p><span aria-hidden="true">⟳</span> Real-time Sync with Supreme Court Registry</p>
    </Card>
  );
}

export function DesignSystemOverview() {
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const feedbackTimer = useRef<number | null>(null);
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return SEARCH_ITEMS.filter((item) => `${item.label} ${item.detail} ${item.terms}`.toLowerCase().includes(normalized));
  }, [query]);

  function showFeedback(message: string, tone: NonNullable<Feedback>["tone"] = "success") {
    setFeedback({ message, tone });
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 2600);
  }

  async function copyValue(value: string, label: string) {
    try { await writeClipboard(value); showFeedback(`${label} copied`); }
    catch { showFeedback("Copy is unavailable in this browser", "danger"); }
  }

  function handleTokenCopy(name: ColorTokenName) { void copyValue(designTokens.color[name], `${name} token`); }

  function exportTokens() {
    const blob = new Blob([serializeDesignTokens()], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href; link.download = "nba-legal-fees-tokens.json"; link.click(); URL.revokeObjectURL(href);
    showFeedback("Token JSON exported");
  }

  function runDemoAction(label: string) { showFeedback(`${label} is a design-system demonstration`); }
  function runLoadingDemo() {
    setDemoLoading(true);
    window.setTimeout(() => { setDemoLoading(false); showFeedback("Verification state demonstrated"); }, 2200);
  }

  return (
    <div className="design-system" style={designTokenCssVariables}>
      <header className="global-header">
        <a className="brand-lockup" href="#overview" aria-label="NBA Legal Fees Practitioner home"><NbaSeal /><span><strong>NBA Legal Fees</strong><small>Practitioner Design System</small></span></a>
        <div className="global-search">
          <Input icon={<SearchIcon />} label="Search components, tokens and guidelines" onChange={(event) => setQuery(event.target.value)} placeholder="Search components, tokens, guidelines..." shortcut="/" type="search" value={query} />
          {query ? <div className="search-results" role="status">{searchResults.length ? searchResults.map((result) => <a key={result.id} href={`#${result.id}`} onClick={() => setQuery("")}><span>{result.label}</span><small>{result.detail}</small></a>) : <p>No components or tokens match “{query}”.</p>}</div> : null}
        </div>
        <nav className="top-nav" aria-label="Primary navigation"><a className="is-active" href="#overview">Overview</a><a href="#colors">Foundations</a><a href="#components">Components</a><a href="#living-cards">Patterns</a><a href="#code-tokens">Resources</a></nav>
        <span className="user-avatar" aria-label="Signed in as practitioner A">A</span>
      </header>
      <div className="mobile-nav" aria-label="Page sections"><a href="#overview">Overview</a><a href="#colors">Foundations</a><a href="#components">Components</a><a href="#living-cards">Patterns</a></div>

      <div className="page-shell">
        <aside className="side-nav"><nav aria-label="Design system sections">{NAV_GROUPS.map((group) => <div className="side-nav__group" key={group.label}><p>{group.label}</p>{group.links.map(([label, id]) => <a className={id === "overview" ? "is-active" : ""} href={`#${id}`} key={id}>{label}</a>)}</div>)}</nav></aside>
        <main className="main-content" id="overview">
          <section className="hero" id="brand">
            <div className="hero__copy"><div className="hero__badges"><Badge tone="brand">v1.2.4 Official</Badge><Badge tone="gold">Nigerian Bar Association</Badge><span>◆ Updated September 2026</span></div><h1>NBA Legal Fees Practitioner</h1><p>The institutional, dependable visual framework powering statutory fee computation, compliant remittance, credentialing, and practitioner administration.</p><div className="hero__actions"><ButtonLink href="#colors" iconLeading={<ShieldIcon />}>Explore Foundations</ButtonLink><ButtonLink href="#components" iconLeading={<GridIcon />} variant="secondary">Component Library</ButtonLink></div><Button className="export-action" iconLeading={<DownloadIcon />} onClick={exportTokens} size="small" variant="ghost">Token Export</Button></div>
            <ArchitectureArtwork />
          </section>

          <section className="metric-grid" aria-label="Design system standards" id="accessibility"><MetricCard label="Primary Authority Color" meta="NBA Forest" value="#004D27" /><MetricCard label="Typography Standard" meta="Self-hosted" value="Geist Sans" /><MetricCard label="Grid & Rhythm Baseline" meta="Strict Spatial" value="4px Metric" /><MetricCard label="Accessibility Standard" meta="Full Tag" value="WCAG 2.1 AAA" /></section>

          <section className="content-section" id="colors">
            <SectionHeading description="Constitutional building blocks engineered for clarity, gravitas, and high reliability across devices." icon={<GridIcon />} title="Design Foundations" />
            <Card className="color-panel"><div className="panel-heading"><div><h3>Institutional Color System</h3><p>Validated contrast pairs guaranteeing legal document legibility across low-tier mobile displays.</p></div><small>Token Key → color-*</small></div><TokenRow names={PRIMARY_TOKENS} onCopy={handleTokenCopy} title="Primary spectrum (NBA forest & containers)" tone="green" /><TokenRow names={GOLD_TOKENS} onCopy={handleTokenCopy} title="Secondary & judicial gold seals" tone="gold" /><TokenRow names={SURFACE_TOKENS} onCopy={handleTokenCopy} title="Surfaces, tonal rhythms & alerts" tone="green" /></Card>
            <div className="foundation-grid">
              <Card className="typography-panel" id="typography"><div className="panel-heading"><div><h3>Typographic Hierarchy</h3><p>Engineered for statute, readability, extended declarations, and mobile legal audiences.</p></div><small>Geist Sans & Mono</small></div><div className="type-specimen"><small>Text-heading-1 / 32px · 40px line · 700 weight</small><strong>Legal Practitioners Act Cap L11</strong></div><div className="type-specimen"><small>Text-heading-2 / 24px · 32px line · 600 weight</small><strong>Remuneration & Practice License Assessment</strong></div><div className="type-specimen"><small>Text-heading-3 / 18px · 28px line · 600 weight</small><strong>NBA National Executive Council Resolution</strong></div><div className="type-specimen type-specimen--body"><small>Text-body / 16px · 24px line · 400 weight</small><p>Every practitioner called to the Nigerian Bar shall remit annual practicing fees as prescribed under the Supreme Court of Nigeria directives.</p></div><div className="type-specimen type-specimen--label"><small>Text-label / 12px · 16px line · 600 weight</small><strong>SCN VERIFIED · ENROLLED 2014 · LAGOS BRANCH A01</strong></div></Card>
              <div className="foundation-stack">
                <Card className="rhythm-panel" id="spacing"><div className="panel-heading"><div><h3>4px Baseline Metric Rhythm</h3><p>Predictable spacing enforces visual discipline in multi-factor calculation modules.</p></div><small>Grid Scale Tokens</small></div>{[["unit (4px)", 12, "Micro-others"], ["stack-sm (8px)", 24, "Form inputs / chips"], ["gutter / stack-md (16px)", 42, "Component padding"], ["range/stack-lg (24px)", 58, "Viewport breakpoints"], ["stack-xl (32px)", 74, "Section separation"]].map(([label, width, usage]) => <div className="rhythm-row" key={label}><span>{label}</span><i style={{ width: `${width}%` }} /><small>{usage}</small></div>)}</Card>
                <Card className="elevation-panel" id="elevation"><div className="panel-heading"><h3>Elevation & Depth Models</h3><small>Institutional Shadows</small></div><div className="elevation-grid">{(["sm", "md", "lg"] as const).map((level, index) => <div className={`elevation-demo elevation-demo--${level}`} key={level}><span>Level {index + 1} Cards</span><strong>shadow-{level}</strong><small>{["4% opacity anchor", "Modal focus", "Supreme badge"][index]}</small></div>)}</div></Card>
              </div>
            </div>
          </section>

          <section className="content-section" id="components">
            <SectionHeading description="Live specimens built from reusable typed primitives and the shared token source." icon={<GridIcon />} title="Component Showcase" />
            <div className="component-grid">
              <Card className="component-panel"><div className="panel-heading"><div><h3>Action Components (Buttons)</h3><p>Statutory authority triggers with crisp active, disabled, and destructive states.</p></div></div><div className="button-demos"><div><Button iconLeading={<ScaleIcon />} onClick={() => runDemoAction("Compute Stamp Duty")} size="small">Compute Stamp Duty</Button><DemoLabel>Primary / Active</DemoLabel></div><div><Button iconLeading={<DownloadIcon />} onClick={() => runDemoAction("Download certificate")} size="small" variant="secondary">Download Certificate</Button><DemoLabel>Secondary / Tertiary</DemoLabel></div><div><Button iconLeading={<AlertIcon />} onClick={() => runDemoAction("Revoke seal access")} size="small" variant="destructive">Revoke Seal Access</Button><DemoLabel>Destructive / Sanction</DemoLabel></div><div><Button disabled iconLeading={<ClockIcon />} size="small" variant="secondary">Verifying SCN...</Button><DemoLabel>Processing / Disabled</DemoLabel></div><div><Button loading={demoLoading} onClick={runLoadingDemo} size="small" variant="ghost">{demoLoading ? "Checking status" : "Try loading state"}</Button><DemoLabel>Accessible / Loading</DemoLabel></div></div></Card>
              <Card className="component-panel" id="status-badges"><div className="panel-heading"><div><h3>Legal Status Indicators & Badges</h3><p>Standardized status chips for digital legal deeds, practitioner records, and court clearance.</p></div></div><div className="status-grid"><div><span>Practicing License</span><Badge icon={<CheckIcon />} tone="success">Active 2026</Badge></div><div><span>Verification Status</span><Badge icon={<ClockIcon />} tone="warning">Pending Review</Badge></div><div><span>Payment State</span><Badge icon={<AlertIcon />} tone="danger">Deferred</Badge></div><div><span>Disciplinary Tribunal</span><Badge icon={<ShieldIcon />} tone="success">Clear Record</Badge></div><div><span>Verification Status</span><Badge icon={<ShieldIcon />} tone="neutral">Defaulted Dues</Badge></div></div><div className="san-row"><Badge tone="gold">§</Badge><div><strong>Senior Advocate of Nigeria (SAN) Seal</strong><small>Verifies Bar Privileges Adequate · Legal Practitioners’ Hierarchy Confirmation</small></div><span aria-hidden="true">↗</span></div></Card>
            </div>
            <Card className="input-panel" id="input-fields"><div className="panel-heading"><div><h3>Input Fields & Validation</h3><p>Accessible data entry primitives for practitioner identity and statutory particulars.</p></div><small>Label · Hint · Error · Disabled</small></div><div className="input-grid"><Input hint="Use the number on your Supreme Court enrolment record." label="Supreme Court number" placeholder="SCN 04219" /><Input error="Enter a valid Nigerian Bar enrolment number." label="Enrolment number" placeholder="Required" /><Input disabled hint="Verified identity fields are locked." label="Verified branch" value="Lagos Branch" readOnly /></div></Card>
          </section>

          <section className="content-section" id="living-cards"><SectionHeading description="High-fidelity ceremonial cards composed from the same tokens and primitives used across the platform." title="Living Specimen Cards" /><Card className="living-panel" padding="compact"><div className="living-grid"><PractitionerCard /><div id="fee-calculator"><FeeCard onAction={() => runDemoAction("Generate official remittance")} /></div><AdoptionCard /></div></Card></section>

          <section className="code-section" id="code-tokens"><div className="panel-heading code-section__heading"><div><h3>Implementation & Code Tokens</h3><p>Ready-to-integrate definitions conforming to official NBA product specifications.</p></div><div className="code-actions"><Badge tone="neutral">TypeScript Preset</Badge><select aria-label="Token preset" defaultValue="tokens"><option value="tokens">designTokens.ts</option><option value="css">CSS Variables</option></select><Button iconLeading={<CopyIcon />} onClick={() => void copyValue(TOKEN_CODE, "Code sample")} size="small" variant="secondary">Copy Snippet</Button></div></div><pre><code>{TOKEN_CODE}</code></pre></section>
        </main>
      </div>

      <footer className="site-footer"><div><NbaSeal compact /><span><strong>Nigerian Bar Association Digital Directorate</strong><small>Plot 2/3, NBA House, Muhammadu Buhari Way, Abuja, Nigeria</small></span></div><nav aria-label="Footer"><a href="#accessibility">Security Certifications</a><a href="#brand">Supreme Court API</a><a href="#code-tokens">Implementation Kit v1.2</a></nav><p>Built for a more accessible justice system.</p></footer>
      <div aria-live="polite" aria-atomic="true" className={`feedback ${feedback ? "feedback--visible" : ""} ${feedback?.tone === "danger" ? "feedback--danger" : ""}`} role="status">{feedback?.message}</div>
    </div>
  );
}
