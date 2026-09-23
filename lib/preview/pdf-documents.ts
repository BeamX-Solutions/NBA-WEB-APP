import { formatNaira } from "../fees/legal-fees.ts";
import { BRANCH_NAME, PRACTITIONER_NAME, PRACTITIONER_SCN, PREVIEW_REFERENCE, type PreviewInvoice } from "./documents.ts";
import type { PDFDocument, PDFPage, PDFFont } from "pdf-lib";

const W = 595.28;
const H = 841.89;
const M = 40;
const green = [0.055, 0.31, 0.2] as const;
const muted = [0.38, 0.43, 0.49] as const;
const gold = [0.72, 0.52, 0.16] as const;
const dark = [0.13, 0.16, 0.17] as const;
const pale = [0.85, 0.87, 0.87] as const;
type Ink = readonly [number, number, number];
type Fonts = { sans: PDFFont; bold: PDFFont; serif: PDFFont };
type Context = { pdf: PDFDocument; fonts: Fonts; rgb: (r: number, g: number, b: number) => ReturnType<typeof import("pdf-lib")["rgb"]> };

async function context(): Promise<Context> {
  const [{ PDFDocument, rgb }, fontkit] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit.default);
  const names = ["DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSerif-Bold.ttf"];
  const bytes = await Promise.all(names.map(async (name) => {
    const response = await fetch("/fonts/" + name);
    if (!response.ok) throw new Error("Could not load PDF font: " + name);
    return response.arrayBuffer();
  }));
  return { pdf, rgb, fonts: {
    sans: await pdf.embedFont(bytes[0], { subset: true }),
    bold: await pdf.embedFont(bytes[1], { subset: true }),
    serif: await pdf.embedFont(bytes[2], { subset: true }),
  } };
}

function color(ctx: Context, ink: Ink) { return ctx.rgb(ink[0], ink[1], ink[2]); }
function write(page: PDFPage, ctx: Context, value: string, x: number, y: number, size = 9, font = ctx.fonts.sans, ink: Ink = dark) {
  page.drawText(value, { x, y, size, font, color: color(ctx, ink) });
}
function right(page: PDFPage, ctx: Context, value: string, x: number, y: number, size = 9, font = ctx.fonts.sans, ink: Ink = dark) {
  write(page, ctx, value, x - font.widthOfTextAtSize(value, size), y, size, font, ink);
}
function line(page: PDFPage, ctx: Context, y: number, ink: Ink = pale, thickness = 0.7) {
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness, color: color(ctx, ink) });
}
function wrap(value: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split("\n")) {
    let row = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = row ? row + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) { row = candidate; continue; }
      if (row) lines.push(row);
      row = "";
      for (const character of word) {
        if (row && font.widthOfTextAtSize(row + character, size) > width) { lines.push(row); row = character; }
        else row += character;
      }
    }
    lines.push(row);
  }
  return lines;
}
function paragraph(page: PDFPage, ctx: Context, value: string, x: number, y: number, width: number, size = 9, leading = 15, font = ctx.fonts.sans, ink: Ink = dark) {
  for (const row of wrap(value, font, size, width)) { if (row) write(page, ctx, row, x, y, size, font, ink); y -= leading; }
  return y;
}
function field(page: PDFPage, ctx: Context, label: string, value: string, top: number) {
  const rows = wrap(value, ctx.fonts.sans, 9.3, 280);
  const height = Math.max(30, 15 + rows.length * 13);
  write(page, ctx, label.toUpperCase(), M, top - 18, 8.2, ctx.fonts.sans, muted);
  rows.forEach((row, index) => right(page, ctx, row, W - M, top - 18 - index * 13, 9.3));
  line(page, ctx, top - height);
  return top - height;
}
function date(value: Date) { return value.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
async function blob(pdf: PDFDocument) { return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" }); }

export async function createInvoicePdf(invoice: PreviewInvoice): Promise<Blob> {
  const ctx = await context();
  const page = ctx.pdf.addPage([W, H]);
  write(page, ctx, "Branch Fee Invoice", M, 806, 19, ctx.fonts.serif, green);
  write(page, ctx, BRANCH_NAME, M, 786, 9.5, ctx.fonts.sans, muted);
  right(page, ctx, "REFERENCE", W - M, 813, 7.6, ctx.fonts.sans, muted);
  right(page, ctx, "Pending issuance", W - M, 797, 9.5, ctx.fonts.bold);
  right(page, ctx, date(invoice.createdAt), W - M, 782, 9, ctx.fonts.sans, muted);
  line(page, ctx, 765, green, 1.5);
  write(page, ctx, "Transaction", M, 747, 12, ctx.fonts.serif);
  let y = 735;
  y = field(page, ctx, "Practitioner", PRACTITIONER_NAME, y);
  y = field(page, ctx, "Supreme Court number", PRACTITIONER_SCN, y);
  y = field(page, ctx, "Parties", invoice.parties, y);
  y = field(page, ctx, "Document type", invoice.document.label, y);
  y = field(page, ctx, invoice.document.category === "tenancy" ? "Annual rental value" : "Consideration / value", formatNaira(invoice.amountKobo), y);
  y = field(page, ctx, "Professional fee", formatNaira(invoice.fee.primaryFeeKobo), y);
  y = field(page, ctx, "Branch amount", formatNaira(invoice.fee.branchLevyKobo) + " (local preview)", y);
  y -= 27;
  write(page, ctx, "Pay to", M, y, 12, ctx.fonts.serif);
  y -= 13;
  y = field(page, ctx, "Account name", PREVIEW_REFERENCE, y);
  y = field(page, ctx, "Account number", PREVIEW_REFERENCE, y);
  y = field(page, ctx, "Bank", PREVIEW_REFERENCE, y);
  y = field(page, ctx, "Payment reference", PREVIEW_REFERENCE, y);
  y -= 52;
  page.drawRectangle({ x: M, y, width: W - 2 * M, height: 42, borderWidth: 0.9, borderColor: color(ctx, gold) });
  paragraph(page, ctx, "No payment details have been issued. Do not transfer money against this local invoice preview.", M + 12, y + 26, W - 2 * M - 24, 8.8, 13);
  paragraph(page, ctx, "Professional fees are the prescribed minimum under the Legal Practitioners (Remuneration) Order, 2023. VAT and disbursements are excluded. The branch amount is a local preview figure.", M, y - 22, W - 2 * M, 7.6, 11, ctx.fonts.sans, muted);
  return blob(ctx.pdf);
}

export async function createTermsPdf(basis: Pick<PreviewInvoice, "document" | "amountKobo" | "fee">, client: string, matter: string): Promise<Blob> {
  const ctx = await context();
  let page = ctx.pdf.addPage([W, H]);
  let y = 808;
  const width = W - 2 * M;
  function ensure(height: number) { if (y - height < 92) { page = ctx.pdf.addPage([W, H]); y = 790; } }
  function section(heading: string, body: string) {
    const rows = wrap(body, ctx.fonts.sans, 9.2, width);
    ensure(34 + rows.length * 15);
    write(page, ctx, heading.toUpperCase(), M, y, 8.6, ctx.fonts.bold, green);
    y -= 18;
    for (const row of rows) { ensure(15); if (row) write(page, ctx, row, M, y, 9.2); y -= 15; }
    y -= 14;
  }
  write(page, ctx, "Terms of Engagement", M, y, 19, ctx.fonts.serif, green);
  y -= 20;
  write(page, ctx, "Issued under the Legal Practitioners (Remuneration for Business, Legal Services and Representation) Order, 2023", M, y, 7.5, ctx.fonts.sans, muted);
  y -= 16; line(page, ctx, y, green, 1.5); y -= 22;
  write(page, ctx, "TO", M, y, 8, ctx.fonts.sans, muted); y -= 16;
  y = paragraph(page, ctx, client.trim(), M, y, width, 10, 15, ctx.fonts.bold) - 15;
  y = field(page, ctx, "Instructions accepted", date(new Date()), y);
  y = field(page, ctx, "Legal practitioner", PRACTITIONER_NAME, y);
  y = field(page, ctx, "Supreme Court number", PRACTITIONER_SCN, y) - 22;
  const basisName = basis.document.category === "tenancy" ? "annual rental value" : basis.document.category === "mortgage" ? "mortgage value" : "property value or consideration";
  section("The instruction", "You have instructed me in connection with " + matter.trim() + ". The work is the preparation of a " + basis.document.label + ", assessed under " + basis.document.description.split(" - ")[0] + " of the Legal Practitioners (Remuneration) Order, 2023.");
  section("Basis of charge", "The fee is calculated on the " + basisName + " of " + formatNaira(basis.amountKobo) + ". The relevant bands in the Order are applied to that value.");
  section("The fee", formatNaira(basis.fee.primaryFeeKobo) + " is the prescribed minimum professional fee. The calculation comprises " + basis.fee.lines.map((item) => item.label + ": " + formatNaira(item.amountKobo)).join("; ") + ". VAT and disbursements are separate.");
  section("The other party", "Where the other party's practitioner reviews the draft instrument under the applicable Scale 4 rule, the indicated half-rate is " + formatNaira(basis.fee.counterpartyFeeKobo) + ". This is not payable to me and is shown only for context.");
  if (ctx.pdf.getPageCount() === 1) { page = ctx.pdf.addPage([W, H]); y = 790; }
  section("Branch fee and registration", "The local preview shows " + formatNaira(basis.fee.branchLevyKobo) + " as a branch amount. The branch must confirm any amount and issue payment details before a transfer. This document creates no payment reference or transaction.");
  section("What is not included", "Value Added Tax and disbursements are excluded, including stamp duty, registration fees, search fees and the cost of Governor's Consent where required.");
  section("Verification", "If a transaction is later created, paid and verified by the branch, the branch may issue a Certificate of Compliance carrying a unique verifiable reference.");
  ensure(130);
  page.drawLine({ start: { x: M, y: y + 4 }, end: { x: M, y: y - 53 }, thickness: 2.5, color: color(ctx, green) });
  y = paragraph(page, ctx, "The Order requires written terms of engagement to reach the client within fourteen days of accepting instructions. This is a locally generated draft for practitioner review before delivery.", M + 15, y - 10, width - 20, 8.7, 13) - 25;
  ensure(85);
  page.drawLine({ start: { x: M, y }, end: { x: M + 185, y }, thickness: 0.7, color: color(ctx, dark) });
  y -= 16; write(page, ctx, PRACTITIONER_NAME, M, y, 9);
  y -= 14; write(page, ctx, "Legal Practitioner · " + PRACTITIONER_SCN, M, y, 8.5, ctx.fonts.sans, muted);
  y -= 26; paragraph(page, ctx, "Prepared with NBA Legal Fees for practitioner review. Figures are exclusive of VAT and disbursements.", M, y, width, 7.5, 11, ctx.fonts.sans, muted);
  return blob(ctx.pdf);
}

// Layout only. Only a verified branch transaction can supply an RBIN,
// certificate number, signature and valid verification QR.
export async function createCertificateLayoutPreviewPdf(): Promise<Blob> {
  const ctx = await context();
  const page = ctx.pdf.addPage([W, H]);
  page.drawRectangle({ x: 12, y: 12, width: W - 24, height: H - 24, borderWidth: 4, borderColor: color(ctx, gold), color: ctx.rgb(1, 0.995, 0.975) });
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 40, borderWidth: 1, borderColor: color(ctx, green) });
  const response = await fetch("/nba-seal.png");
  if (!response.ok) throw new Error("Could not load the NBA seal.");
  const seal = await ctx.pdf.embedPng(await response.arrayBuffer());
  page.drawImage(seal, { x: 47, y: 738, width: 48, height: 48 });
  page.drawImage(seal, { x: W - 95, y: 738, width: 48, height: 48 });
  page.drawImage(seal, { x: 190, y: 330, width: 215, height: 215, opacity: 0.08 });
  for (const x of [30, W - 74]) {
    for (const y of [45, H - 76]) {
      page.drawLine({ start: { x, y }, end: { x: x + 35, y }, thickness: 1.1, color: color(ctx, gold) });
      page.drawLine({ start: { x, y }, end: { x, y: y + 30 }, thickness: 1.1, color: color(ctx, gold) });
    }
  }
  const centered = (value: string, y: number, size: number, ink: Ink = green) => write(page, ctx, value, (W - ctx.fonts.serif.widthOfTextAtSize(value, size)) / 2, y, size, ctx.fonts.serif, ink);
  centered("NIGERIAN BAR ASSOCIATION", 766, 19);
  centered("A N A O C H A   B R A N C H", 745, 10);
  line(page, ctx, 713, gold); centered("CERTIFICATE OF COMPLIANCE", 675, 19); line(page, ctx, 646, gold);
  centered("THIS IS TO CERTIFY THAT", 620, 10, dark);
  paragraph(page, ctx, "Certificate fields will be populated only after branch verification and issuance.", 82, 590, W - 164, 9.5, 16);
  const labels = ["NAME OF LAWYER", "RBIN", "SUPREME COURT NUMBER", "PARTIES TO THE DOCUMENT", "TYPE OF DOCUMENT", "CONSIDERATION"];
  let y = 525;
  labels.forEach((label, index) => {
    write(page, ctx, String(index + 1) + ".  " + label, 55, y, 8.5, ctx.fonts.serif, green);
    page.drawLine({ start: { x: 265, y: y - 3 }, end: { x: W - 55, y: y - 3 }, thickness: 0.5, color: color(ctx, gold) });
    y -= 33;
  });
  centered("PREVIEW - NOT ISSUED", 274, 15, muted);
  paragraph(page, ctx, "An issued certificate will include a verified RBIN, QR code, issue date, certificate number and authorised branch signature.", 75, 237, W - 150, 8.6, 15);
  write(page, ctx, "Date of Issue: Pending", 55, 86, 8, ctx.fonts.bold, green);
  write(page, ctx, "Certificate No.: Pending", 55, 66, 8, ctx.fonts.bold, green);
  page.drawLine({ start: { x: 395, y: 88 }, end: { x: 540, y: 88 }, thickness: 0.7, color: color(ctx, dark) });
  write(page, ctx, "Authorised branch signature", 410, 70, 7.6, ctx.fonts.sans, muted);
  return blob(ctx.pdf);
}
