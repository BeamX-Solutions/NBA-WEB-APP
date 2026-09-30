import { isUuid, databaseDocumentTypes } from "../calculator/contracts.ts";
import { DOCUMENT_TYPES } from "../fees/legal-fees.ts";
import { asRow, money, text } from "../transactions/contracts.ts";
import type { Certificate, VerificationRecord } from "./types.ts";

function documentLabel(value: unknown): string | null {
  return DOCUMENT_TYPES.find(item => databaseDocumentTypes[item.id as keyof typeof databaseDocumentTypes] === value)?.label ?? null;
}

function issueDate(value: unknown): { date: string; long: string; year: string } | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}[T ]/.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos" }).format(date),
    long: new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "long", year: "numeric" }).format(date),
    year: new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", year: "numeric" }).format(date),
  };
}

export function normalizeRbin(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9/._-]{0,199}$/.test(normalized) ? normalized : null;
}

/** Catch-all route segments, each decoded at most once (encoded slashes may stay encoded in params): `/verify/NBA%2F2026%2F1` arrives as one segment, `/verify/NBA/2026/1` as three. */
export function rbinFromSegments(segments: readonly string[]): string | null {
  if (!segments.length) return null;
  const decoded: string[] = [];
  for (const segment of segments) {
    try { decoded.push(segment.includes("%") ? decodeURIComponent(segment) : segment); } catch { return null; }
  }
  return normalizeRbin(decoded.join("/"));
}

export function verificationPath(rbin: string): string {
  return `/verify/${encodeURIComponent(rbin)}`;
}

/**
 * Host of the public verification page printed into certificate QR codes. Shared with mobile
 * (EXPO_PUBLIC_VERIFICATION_URL) and must not change once real certificates are issued.
 */
export const DEFAULT_VERIFICATION_BASE_URL = "https://nba-mobile-app.vercel.app";

export function verificationBaseUrl(value: string | undefined = process.env.NEXT_PUBLIC_VERIFICATION_URL): string {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "https:" && url.protocol !== "http:") return DEFAULT_VERIFICATION_BASE_URL;
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return DEFAULT_VERIFICATION_BASE_URL;
  }
}

/** Identical to mobile verificationUrlFor, so both apps print the same QR target. */
export function verificationUrlFor(rbin: string, base: string = verificationBaseUrl()): string {
  return `${base}${verificationPath(rbin)}`;
}

export function parseCertificate(value: unknown, identity: { name: string; scn: string }): Certificate | null {
  const row = asRow(value);
  const transaction = asRow(row?.transactions);
  const branch = asRow(transaction?.branches);
  if (!row || !transaction || !branch || !isUuid(row.id) || !isUuid(row.transaction_id) || transaction.status !== "verified") return null;
  const rbin = text(transaction.rbin);
  const number = text(row.certificate_number);
  const issued = issueDate(row.issued_at);
  const document = documentLabel(transaction.document_type);
  const consideration = money(transaction.consideration);
  const parties = text(transaction.parties);
  const branchName = text(branch.name);
  if (!rbin || !normalizeRbin(rbin) || !number || !issued || !document || !consideration || !parties || !branchName) return null;
  if (row.revoked_at !== null && !issueDate(row.revoked_at)) return null;
  return {
    id: row.id, year: issued.year, rbin, certificateNumber: number, issuedAt: issued.date, issuedOn: issued.long,
    documentType: document, practitioner: identity.name, scn: identity.scn,
    parties, consideration, branch: branchName, chairman: text(branch.chairman_name) ?? "Unavailable",
    chairmanSignaturePath: text(branch.chairman_signature_url),
    revoked: row.revoked_at !== null, revocationReason: text(row.revocation_reason),
  };
}

export function parseVerification(value: unknown): VerificationRecord | null {
  const row = asRow(value);
  if (!row || row.found !== true || typeof row.revoked !== "boolean") return null;
  const rbin = text(row.rbin);
  const certificateNumber = text(row.certificate_number);
  const issued = issueDate(row.issued_at);
  const documentType = documentLabel(row.document_type);
  const practitioner = text(row.practitioner_name);
  const scn = text(row.scn);
  const branch = text(row.branch_name);
  if (!rbin || !normalizeRbin(rbin) || !certificateNumber || !issued || !documentType || !practitioner || !scn || !branch) return null;
  return { rbin, certificateNumber, issuedAt: issued.date, documentType, practitioner, scn, branch, revoked: row.revoked, revocationReason: text(row.revocation_reason) };
}
