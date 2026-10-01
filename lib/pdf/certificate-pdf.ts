import QRCode from "qrcode";
import type { PDFImage, PDFPage, RGB } from "pdf-lib";
import { CERTIFICATE_NOTE, CERTIFICATE_RECITAL, certificateParticulars, type CertificateFacts } from "../certificates/wording.ts";
import type { PdfAssets } from "./assets.ts";
import { A4, createCanvas, drawCentered, drawLeft, drawSpaced, drawWrapped, fitSize, hex, toPdfBlob, wrap, type Canvas } from "./kit.ts";

/**
 * The Certificate of Compliance, following mobile/lib/pdf.ts certificateHtml: gold double frame on
 * cream, corner flourishes, a faint seal watermark, six numbered particulars on dotted leaders, the
 * QR code, and the chairman's block. The QR and the RBIN it carries are what a registry checks; the
 * printed document proves nothing on its own.
 */
export type CertificatePdfData = CertificateFacts & {
  certificateNumber: string;
  issuedOn: string;
  branch: string;
  chairman: string | null;
  /** PNG or JPEG bytes from the private signatures bucket, or null to print the name over an empty rule. */
  signature: Uint8Array | null;
  revoked: boolean;
  verificationUrl: string;
};

const W = A4.width;
const H = A4.height;
const SHEET = 20;
const LEFT = SHEET + 22.5;
const RIGHT = W - SHEET - 22.5;
const CONTENT = RIGHT - LEFT;
const deep = hex("#123d24");
const ink = hex("#14301f");
const soft = hex("#40503f");
const flourish = hex("#a8842a");
const ruleGold = hex("#b99b45");

function drawFrame(page: PDFPage): void {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hex("#b8912f") });
  page.drawRectangle({ x: 10.5, y: 10.5, width: W - 21, height: H - 21, color: hex("#d8b455"), borderColor: hex("#7d5f14"), borderWidth: 1.5 });
  page.drawRectangle({ x: 14.5, y: 14.5, width: W - 29, height: H - 29, color: hex("#fbf7ef"), borderColor: hex("#7d5f14"), borderWidth: 0.75 });
  page.drawRectangle({ x: SHEET, y: SHEET, width: W - 2 * SHEET, height: H - 2 * SHEET, borderColor: hex("#cbb98c"), borderWidth: 0.75 });
}

/** The mobile corner SVG, mirrored into each corner rather than rotated. */
function drawCorner(page: PDFPage, flipX: boolean, flipY: boolean): void {
  const size = 43.5;
  const scale = size / 60;
  const left = flipX ? W - SHEET - 2 - size : SHEET + 2;
  const top = flipY ? SHEET + 2 + size : H - SHEET - 2;
  const map = (x: number, y: number): [number, number] => [flipX ? 60 - x : x, flipY ? 60 - y : y];
  const p = (x: number, y: number) => map(x, y).join(" ");
  const curves: [string, number, number][] = [
    [`M${p(4, 4)} L${p(22, 4)} M${p(4, 4)} L${p(4, 22)}`, 2.4, 1],
    [`M${p(9, 9)} C${p(23, 9)} ${p(35, 11)} ${p(43, 15)}`, 1.4, 1],
    [`M${p(9, 9)} C${p(9, 23)} ${p(11, 35)} ${p(15, 43)}`, 1.4, 1],
    [`M${p(14, 14)} C${p(14, 23)} ${p(15, 31)} ${p(18, 38)}`, 1.4, 0.65],
    [`M${p(14, 14)} C${p(23, 14)} ${p(31, 15)} ${p(38, 18)}`, 1.4, 0.65],
  ];
  for (const [path, width, opacity] of curves) page.drawSvgPath(path, { x: left, y: top, scale, borderColor: flourish, borderWidth: width, borderOpacity: opacity });
  for (const [cx, cy, r] of [[30, 12, 2.1], [12, 30, 2.1], [20, 20, 1.4]] as const) {
    const [mx, my] = map(cx, cy);
    page.drawCircle({ x: left + mx * scale, y: top - my * scale, size: r * scale, color: flourish });
  }
}

function drawStarRule(page: PDFPage, y: number): void {
  const center = W / 2;
  page.drawLine({ start: { x: LEFT, y }, end: { x: center - 9, y }, thickness: 0.75, color: ruleGold });
  page.drawLine({ start: { x: center + 9, y }, end: { x: RIGHT, y }, thickness: 0.75, color: ruleGold });
  page.drawSvgPath("M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z", { x: center, y, color: ruleGold });
}

async function embedSignature(canvas: Canvas, bytes: Uint8Array | null): Promise<PDFImage | null> {
  if (!bytes || bytes.length < 4) return null;
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return await canvas.pdf.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await canvas.pdf.embedJpg(bytes);
  } catch {
    // An unreadable image must not stop the certificate; the name prints over an empty rule.
  }
  return null;
}

function drawParticulars(canvas: Canvas, data: CertificatePdfData, top: number): number {
  const { page, fonts } = canvas;
  const style = { font: fonts.bold, size: 8.6, color: ink };
  const valueX = LEFT + 163;
  const valueWidth = RIGHT - valueX;
  let y = top;
  certificateParticulars(data).forEach(({ label, value }, index) => {
    y -= 16;
    drawLeft(page, `${index + 1}.`, LEFT, y, style);
    drawLeft(page, label, LEFT + 15, y, { ...style, size: fitSize(label, fonts.bold, 136, 8.6, 7) });
    drawLeft(page, ":", LEFT + 154, y, style);
    const lines = wrap(value, fonts.bold, 8.6, valueWidth);
    lines.forEach((line, lineIndex) => {
      const baseline = y - lineIndex * 12;
      drawLeft(page, line, valueX, baseline, style);
      page.drawLine({ start: { x: valueX, y: baseline - 3 }, end: { x: RIGHT, y: baseline - 3 }, thickness: 0.6, color: hex("#9d8b5f"), dashArray: [1, 1.6] });
    });
    y -= (lines.length - 1) * 12;
  });
  return y;
}

function drawFoot(canvas: Canvas, data: CertificatePdfData, qr: PDFImage, signature: PDFImage | null): void {
  const { page, fonts } = canvas;
  const base = SHEET + 15;
  const small = { font: fonts.sans, size: 7.5, color: ink };
  const label = { ...small, font: fonts.bold };

  drawLeft(page, "Date of Issue:", LEFT, base + 62, label);
  drawLeft(page, data.issuedOn, LEFT, base + 51, small);
  drawLeft(page, "Certificate No.:", LEFT, base + 36, label);
  drawLeft(page, data.certificateNumber, LEFT, base + 25, { ...small, size: fitSize(data.certificateNumber, fonts.sans, 150, 7.5, 5.5) });

  page.drawImage(qr, { x: W / 2 - 33, y: base + 12, width: 66, height: 66 });
  drawCentered(page, "Scan to verify this certificate", W / 2, base + 3, { font: fonts.sans, size: 5.6, color: hex("#4c5a4b") });

  const sigCenter = RIGHT - 71;
  const rule = base + 36;
  if (signature) {
    const scale = Math.min(135 / signature.width, 25.5 / signature.height);
    const width = signature.width * scale;
    page.drawImage(signature, { x: sigCenter - width / 2, y: rule - 4.5, width, height: signature.height * scale });
  }
  page.drawLine({ start: { x: sigCenter - 71, y: rule }, end: { x: sigCenter + 71, y: rule }, thickness: 0.75, color: ink });
  const name = data.chairman ?? "The Chairman";
  drawCentered(page, name, sigCenter, rule - 10, { ...label, size: fitSize(name, fonts.bold, 142, 7.5, 5.5) });
  drawCentered(page, "CHAIRMAN", sigCenter, rule - 21, small);
  const branch = data.branch.toUpperCase();
  drawCentered(page, branch, sigCenter, rule - 32, { ...small, size: fitSize(branch, fonts.sans, 142, 7.5, 5) });
}

export async function createCertificatePdf(data: CertificatePdfData, assets: PdfAssets): Promise<Blob> {
  if (!/^https?:\/\//.test(data.verificationUrl)) throw new Error("A full verification URL is required.");
  const canvas = await createCanvas(assets);
  const { page, fonts, seal } = canvas;
  const qr = await canvas.pdf.embedPng(await QRCode.toBuffer(data.verificationUrl, { type: "png", margin: 0, width: 264, errorCorrectionLevel: "M", color: { dark: "#14301f", light: "#fbf7ef" } }));
  const signature = await embedSignature(canvas, data.signature);

  drawFrame(page);
  const watermarkCenter = H - (SHEET + 0.52 * (H - 2 * SHEET));
  page.drawImage(seal, { x: W / 2 - 109, y: watermarkCenter - 109, width: 218, height: 218, opacity: 0.07 });
  drawCorner(page, false, false);
  drawCorner(page, true, false);
  drawCorner(page, true, true);
  drawCorner(page, false, true);

  let y = H - SHEET - 19.5;
  if (data.revoked) {
    page.drawRectangle({ x: LEFT, y: y - 18, width: CONTENT, height: 18, color: hex("#8d2318") });
    drawSpaced(page, "REVOKED", W / 2, y - 12.5, 3.75, { font: fonts.bold, size: 9.8, color: hex("#ffffff") as RGB });
    y -= 27;
  }

  page.drawImage(seal, { x: LEFT, y: y - 46.5, width: 46.5, height: 46.5 });
  page.drawImage(seal, { x: RIGHT - 46.5, y: y - 46.5, width: 46.5, height: 46.5 });
  const titleWidth = CONTENT - 2 * 56;
  drawCentered(page, "NIGERIAN BAR ASSOCIATION", W / 2, y - 22, { font: fonts.serif, size: fitSize("NIGERIAN BAR ASSOCIATION", fonts.serif, titleWidth, 20, 14), color: deep });
  const branchLine = data.branch.replace(/^NBA\s+/i, "").toUpperCase();
  drawSpaced(page, branchLine, W / 2, y - 38, 3.75, { font: fonts.bold, size: fitSize(branchLine, fonts.bold, titleWidth - branchLine.length * 3.75, 10.5, 6.5), color: deep });
  y -= 56;

  drawStarRule(page, y - 4);
  drawCentered(page, "CERTIFICATE OF", W / 2, y - 32, { font: fonts.serif, size: 25, color: deep });
  drawCentered(page, "COMPLIANCE", W / 2, y - 58, { font: fonts.serif, size: 25, color: deep });
  drawStarRule(page, y - 76);
  y -= 100;

  drawSpaced(page, "THIS IS TO CERTIFY THAT", W / 2, y, 1, { font: fonts.serif, size: 10.5, color: ink });
  y = drawWrapped(page, CERTIFICATE_RECITAL, { x: LEFT + 10.5, y: y - 20, width: CONTENT - 21, leading: 16.4, align: "center", font: fonts.sans, size: 9.4, color: ink });

  y = drawParticulars(canvas, data, y - 2);

  const host = data.verificationUrl.split("/verify/")[0];
  drawWrapped(page, `${CERTIFICATE_NOTE} It can be checked independently: scan the code below, or enter the RBIN at ${host}. A printed copy proves nothing on its own.`, { x: LEFT + 15, y: y - 26, width: CONTENT - 30, leading: 12.6, align: "center", font: fonts.sans, size: 7.9, color: soft });

  drawFoot(canvas, data, qr, signature);
  return toPdfBlob(canvas.pdf);
}
