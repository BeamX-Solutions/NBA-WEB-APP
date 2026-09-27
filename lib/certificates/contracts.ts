import { isUuid, databaseDocumentTypes } from "../calculator/contracts.ts";
import { DOCUMENT_TYPES } from "../fees/legal-fees.ts";
import { asRow, money, text } from "../transactions/contracts.ts";
import type { Certificate, VerificationRecord } from "./types.ts";

function documentLabel(value: unknown): string | null {
  return DOCUMENT_TYPES.find(item => databaseDocumentTypes[item.id as keyof typeof databaseDocumentTypes] === value)?.label ?? null;
}

function issueDate(value: unknown): { date: string; year: string } | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}[T ]/.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos" }).format(date),
    year: new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", year: "numeric" }).format(date),
  };
}

export function normalizeRbin(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9/._-]{0,199}$/.test(normalized) ? normalized : null;
}

// Encoded slash segments may remain encoded in Next.js params. Decode at most once.
export function decodeRbinSegment(value: string): string | null {
  if (!value.includes("%")) return normalizeRbin(value);
  try { return normalizeRbin(decodeURIComponent(value)); } catch { return null; }
}

export function verificationPath(rbin: string): string {
  return `/verify/${encodeURIComponent(rbin)}`;
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
  if (row.pdf_url !== null && !text(row.pdf_url)) return null;
  return {
    id: row.id, year: issued.year, rbin, certificateNumber: number, issuedAt: issued.date,
    documentType: document, practitioner: identity.name, scn: identity.scn,
    parties, consideration, branch: branchName, chairman: text(branch.chairman_name) ?? "Unavailable",
    revoked: row.revoked_at !== null, revocationReason: text(row.revocation_reason), pdfUrl: text(row.pdf_url),
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

// Only known project Storage URLs can be resolved through the owner's Storage session.
export function certificatePdfLocation(value: string | null, projectUrl: string): { bucket: string; path: string } | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.origin !== new URL(projectUrl).origin || url.username || url.password) return null;
    const match = /^\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (!match) return null;
    const bucket = decodeURIComponent(match[1]);
    const path = decodeURIComponent(match[2]);
    if (bucket.includes("/") || path.split("/").some(segment => !segment || segment === "." || segment === "..") || /[\\\x00-\x1f]/.test(bucket + path)) return null;
    return { bucket, path };
  } catch { return null; }
}
