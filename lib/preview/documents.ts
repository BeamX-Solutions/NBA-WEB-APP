import type { DocumentType, FeeBreakdown } from "../fees/legal-fees.ts";

export const PREVIEW_REFERENCE = "Available after issuance";
export const PRACTITIONER_NAME = "Adaeze Okonkwo";
export const PRACTITIONER_SCN = "SCN/2015/041287";
export const BRANCH_NAME = "NBA Anaocha Branch";

export type PreviewInvoice = {
  document: DocumentType;
  amountKobo: bigint;
  fee: FeeBreakdown;
  parties: string;
  createdAt: Date;
};

export function validateText(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter " + label.toLowerCase() + ".";
  if (trimmed.length > 160) return label + " must be 160 characters or fewer.";
  return null;
}

export function validateProof(file: File): string | null {
  const types = new Set(["application/pdf", "image/jpeg", "image/png"]);
  const extension = file.name.split(".").pop()?.toLowerCase();
  const extensions = new Set(["pdf", "jpg", "jpeg", "png"]);
  if (!types.has(file.type) || !extension || !extensions.has(extension)) return "Select a PDF, JPG, or PNG file.";
  if (file.size > 10 * 1024 * 1024) return "Select a file no larger than 10 MB.";
  if (file.size === 0) return "Select a file that is not empty.";
  return null;
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { createInvoicePdf, createTermsPdf, createCertificateLayoutPreviewPdf } from "./pdf-documents.ts";
