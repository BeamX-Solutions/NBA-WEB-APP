import type { PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import type { SampleCertificate } from "./sample-certificates";

const width = 595.28;
const height = 841.89;
const green = [0.08, 0.25, 0.17] as const;
const gold = [0.69, 0.51, 0.2] as const;
const cream = [1, 0.993, 0.968] as const;
type Color = readonly [number, number, number];

function drawCentered(page: PDFPage, value: string, font: PDFFont, size: number, y: number, rgb: (r: number, g: number, b: number) => ReturnType<typeof import("pdf-lib")["rgb"]>, ink: Color = green) {
  page.drawText(value, { x: (width - font.widthOfTextAtSize(value, size)) / 2, y, font, size, color: rgb(...ink) });
}

function fitSize(value: string, font: PDFFont, maxWidth: number, start: number, minimum: number): number {
  let size = start;
  while (size > minimum && font.widthOfTextAtSize(value, size) > maxWidth) size -= 0.3;
  return size;
}

function drawRule(page: PDFPage, y: number, rgb: (r: number, g: number, b: number) => ReturnType<typeof import("pdf-lib")["rgb"]>, x1 = 48, x2 = width - 48) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.7, color: rgb(...gold) });
}

function drawCorner(page: PDFPage, x: number, y: number, dx: number, dy: number, rgb: (r: number, g: number, b: number) => ReturnType<typeof import("pdf-lib")["rgb"]>) {
  for (let offset = 0; offset < 8; offset += 5) {
    page.drawLine({ start: { x: x + dx * offset, y: y + dy * offset }, end: { x: x + dx * (offset + 17), y: y + dy * offset }, thickness: 1, color: rgb(...gold) });
    page.drawLine({ start: { x: x + dx * offset, y: y + dy * offset }, end: { x: x + dx * offset, y: y + dy * (offset + 17) }, thickness: 1, color: rgb(...gold) });
  }
}

export async function createSampleCertificatePdf(certificate: SampleCertificate, verificationUrl: string): Promise<Blob> {
  if (!verificationUrl.startsWith("http://") && !verificationUrl.startsWith("https://")) throw new Error("A full verification URL is required.");
  if (!certificate.rbin || !certificate.certificateNumber) throw new Error("Certificate details are incomplete.");

  const [{ PDFDocument, rgb }, fontkit] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit.default);
  const assets = await Promise.all(["/fonts/DejaVuSans.ttf", "/fonts/DejaVuSans-Bold.ttf", "/fonts/DejaVuSerif-Bold.ttf", "/nba-seal.png"].map(async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.arrayBuffer();
  }));
  const [sans, bold, serif] = await Promise.all([
    pdf.embedFont(assets[0], { subset: true }),
    pdf.embedFont(assets[1], { subset: true }),
    pdf.embedFont(assets[2], { subset: true }),
  ]);
  const seal = await pdf.embedPng(assets[3]);
  const qr = await pdf.embedPng(await fetch(await QRCode.toDataURL(verificationUrl, { width: 160, margin: 0, color: { dark: "#143d29", light: "#fffdfa" } })).then((response) => response.arrayBuffer()));
  const page = pdf.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 12, y: 12, width: width - 24, height: height - 24, color: rgb(...cream), borderColor: rgb(...gold), borderWidth: 3.5 });
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: rgb(...gold), borderWidth: 0.8 });
  drawCorner(page, 28, 28, 1, 1, rgb);
  drawCorner(page, width - 28, 28, -1, 1, rgb);
  drawCorner(page, 28, height - 28, 1, -1, rgb);
  drawCorner(page, width - 28, height - 28, -1, -1, rgb);
  page.drawImage(seal, { x: 45, y: 737, width: 52, height: 52 });
  page.drawImage(seal, { x: width - 97, y: 737, width: 52, height: 52 });
  page.drawImage(seal, { x: 195, y: 335, width: 205, height: 205, opacity: 0.055 });
  drawCentered(page, "NIGERIAN BAR ASSOCIATION", serif, 19, 771, rgb);
  drawCentered(page, certificate.branch.split("").join(" "), bold, 9.2, 751, rgb);
  drawRule(page, 723, rgb);
  drawCentered(page, "CERTIFICATE OF", serif, 24, 686, rgb);
  drawCentered(page, "COMPLIANCE", serif, 24, 656, rgb);
  drawRule(page, 638, rgb);
  drawCentered(page, "THIS IS TO CERTIFY THAT", serif, 10, 609, rgb);
  const statement = [
    "The undersigned Legal Practitioner whose particulars appear below has duly",
    "prepared the title document as described herein in accordance with the Rules",
    "of Professional Conduct, the Legal Practitioners Act and the Branch",
    "Remuneration Order.",
  ];
  statement.forEach((line, index) => drawCentered(page, line, sans, 8.8, 580 - index * 14, rgb));
  const rows: readonly [string, string][] = [
    ["NAME OF LAWYER", certificate.practitioner],
    ["RBIN", certificate.rbin],
    ["SUPREME COURT NUMBER", certificate.scn],
    ["PARTIES TO THE DOCUMENT", certificate.parties],
    ["TYPE OF DOCUMENT", certificate.documentType],
    ["CONSIDERATION", certificate.consideration],
  ];
  rows.forEach(([label, value], index) => {
    const y = 502 - index * 29;
    page.drawText(`${index + 1}.  ${label}`, { x: 48, y, font: serif, size: label.length > 20 ? 7.3 : 8.5, color: rgb(...green) });
    const size = fitSize(value, bold, 315, 9.2, 7.2);
    page.drawText(`:  ${value}`, { x: 207, y, font: bold, size, color: rgb(...green) });
    drawRule(page, y - 7, rgb, 48, width - 48);
  });
  drawCentered(page, "This Certificate is issued as evidence of compliance with the Branch", sans, 8, 305, rgb);
  drawCentered(page, "Remuneration Order and for record purposes.", sans, 8, 291, rgb);
  page.drawText("Date of Issue:", { x: 48, y: 254, font: bold, size: 8.5, color: rgb(...green) });
  page.drawText(certificate.issuedAt, { x: 48, y: 239, font: sans, size: 8.5, color: rgb(...green) });
  page.drawText("Certificate No.:", { x: 350, y: 254, font: bold, size: 8.5, color: rgb(...green) });
  page.drawText(certificate.certificateNumber, { x: 350, y: 239, font: sans, size: fitSize(certificate.certificateNumber, sans, 195, 8.5, 7), color: rgb(...green) });
  page.drawImage(qr, { x: 48, y: 98, width: 112, height: 112 });
  page.drawText("Scan to verify sample", { x: 47, y: 82, font: sans, size: 7, color: rgb(...green) });
  page.drawLine({ start: { x: 360, y: 144 }, end: { x: 544, y: 144 }, thickness: 0.8, color: rgb(...green) });
  const chairmanSize = fitSize(certificate.chairman, bold, 184, 10, 8);
  page.drawText(certificate.chairman, { x: 544 - bold.widthOfTextAtSize(certificate.chairman, chairmanSize), y: 127, font: bold, size: chairmanSize, color: rgb(...green) });
  page.drawText("CHAIRMAN", { x: 481, y: 111, font: sans, size: 8, color: rgb(...green) });
  page.drawText(`NBA ${certificate.branch}`, { x: 389, y: 96, font: sans, size: 7.7, color: rgb(...green) });
  drawCentered(page, "SAMPLE - NOT ISSUED", bold, 11, 804, rgb, [0.55, 0.31, 0.16]);
  return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" });
}
