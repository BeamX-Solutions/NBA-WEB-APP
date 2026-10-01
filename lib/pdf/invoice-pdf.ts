import { ATTRIBUTION, ORDER_FULL_NAME, PRODUCT_NAME } from "../branding.ts";
import type { PdfAssets } from "./assets.ts";
import { A4, createCanvas, drawLeft, drawRight, drawSpaced, drawWrapped, hex, toPdfBlob, wrap, type Canvas } from "./kit.ts";

/** The client's bill, following mobile/lib/pdf.ts invoiceHtml. All money values arrive formatted. */
export type InvoicePdfData = {
  invoiceNumber: string;
  issuedOn: string;
  practitioner: string;
  scn: string;
  parties: string;
  documentType: string;
  amountPayable: string;
  branchFee: string;
  branchName: string;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
};

const M = 40;
const green = hex("#0B5D33");
const ink = hex("#1A1A1A");
const muted = hex("#6B7280");
const line = hex("#E3E6E3");

function row(canvas: Canvas, label: string, value: string, top: number): number {
  const { page, fonts } = canvas;
  const values = wrap(value, fonts.sans, 9.5, 300);
  const height = Math.max(22, 8 + values.length * 13);
  drawLeft(page, label.toUpperCase(), M, top - 14, { font: fonts.sans, size: 7.8, color: muted });
  values.forEach((text, index) => drawRight(page, text, A4.width - M, top - 14 - index * 13, { font: fonts.sans, size: 9.5, color: ink }));
  page.drawLine({ start: { x: M, y: top - height }, end: { x: A4.width - M, y: top - height }, thickness: 0.6, color: line });
  return top - height;
}

function heading(canvas: Canvas, value: string, y: number): number {
  drawLeft(canvas.page, value, M, y, { font: canvas.fonts.serif, size: 11.5, color: ink });
  return y - 6;
}

function notice(canvas: Canvas, value: string, top: number): number {
  const { page, fonts } = canvas;
  const lines = wrap(value, fonts.sans, 8.4, A4.width - 2 * M - 20);
  const height = 16 + lines.length * 12;
  page.drawRectangle({ x: M, y: top - height, width: A4.width - 2 * M, height, color: hex("#FDF6E3"), borderColor: hex("#F5C33B"), borderWidth: 0.8 });
  lines.forEach((text, index) => drawLeft(page, text, M + 10, top - 16 - index * 12, { font: fonts.sans, size: 8.4, color: ink }));
  return top - height;
}

export async function createInvoicePdf(data: InvoicePdfData, assets: PdfAssets): Promise<Blob> {
  const canvas = await createCanvas(assets);
  const { page, fonts, seal } = canvas;
  page.drawImage(seal, { x: (A4.width - 285) / 2, y: (A4.height - 285) / 2, width: 285, height: 285, opacity: 0.05 });

  // Letterhead.
  page.drawImage(seal, { x: (A4.width - 44) / 2, y: 758, width: 44, height: 44 });
  drawSpaced(page, "NIGERIAN BAR ASSOCIATION", A4.width / 2, 744, 1.1, { font: fonts.serif, size: 9.8, color: green });

  // Head.
  drawLeft(page, "Invoice", M, 708, { font: fonts.serif, size: 16.5, color: green });
  drawLeft(page, data.branchName, M, 692, { font: fonts.sans, size: 9.5, color: muted });
  drawRight(page, "REFERENCE", A4.width - M, 712, { font: fonts.sans, size: 7.8, color: muted });
  drawRight(page, data.invoiceNumber, A4.width - M, 699, { font: fonts.bold, size: 9.8, color: ink });
  drawRight(page, data.issuedOn, A4.width - M, 686, { font: fonts.sans, size: 9, color: muted });
  page.drawLine({ start: { x: M, y: 676 }, end: { x: A4.width - M, y: 676 }, thickness: 2.2, color: green });

  let y = heading(canvas, "Transaction", 654);
  y = row(canvas, "Practitioner", data.practitioner, y);
  y = row(canvas, "Supreme Court Number", data.scn, y);
  y = row(canvas, "Parties", data.parties, y);
  y = row(canvas, "Document Type", data.documentType, y);

  // Remuneration.
  const note = `The professional fee payable by the client, paid in full into the branch account below. The branch deducts its fee of ${data.branchFee} and remits the balance to the legal practitioner.`;
  const noteLines = wrap(note, fonts.sans, 8.2, A4.width - 2 * M - 30);
  const boxHeight = 58 + noteLines.length * 11;
  const boxTop = y - 16;
  page.drawRectangle({ x: M, y: boxTop - boxHeight, width: A4.width - 2 * M, height: boxHeight, color: hex("#F2F4F2") });
  page.drawRectangle({ x: M, y: boxTop - boxHeight, width: 3, height: boxHeight, color: green });
  drawLeft(page, "REMUNERATION", M + 14, boxTop - 16, { font: fonts.sans, size: 7.8, color: muted });
  drawLeft(page, data.amountPayable, M + 14, boxTop - 42, { font: fonts.serif, size: 22.5, color: green });
  drawWrapped(page, note, { x: M + 14, y: boxTop - 58, width: A4.width - 2 * M - 30, leading: 11, font: fonts.sans, size: 8.2, color: muted });
  y = boxTop - boxHeight - 20;

  y = heading(canvas, "Pay to", y);
  const hasBankDetails = Boolean(data.accountName && data.accountNumber && data.bankName);
  if (hasBankDetails) {
    y = row(canvas, "Account Name", data.accountName ?? "", y);
    y = row(canvas, "Account Number", data.accountNumber ?? "", y);
    y = row(canvas, "Bank", data.bankName ?? "", y);
    y = row(canvas, "Payment Reference", data.invoiceNumber, y);
  } else {
    y = notice(canvas, "This branch has not published its bank details. Contact the branch secretariat before paying. Do not pay into any account not confirmed by your branch.", y - 4);
  }

  y = notice(canvas, `Quote the payment reference on your transfer, and send the payment slip to your legal practitioner. They upload it in ${PRODUCT_NAME} so the branch can verify the payment and issue the Certificate of Compliance.`, y - 14);

  drawWrapped(page, `Fees are computed under the ${ORDER_FULL_NAME}. The figures shown are prescribed minimums, exclusive of VAT and of disbursements such as stamp duties, registration fees and Governor's Consent. ${ATTRIBUTION}.`, { x: M, y: y - 22, width: A4.width - 2 * M, leading: 11, font: fonts.sans, size: 7.5, color: muted });

  return toPdfBlob(canvas.pdf);
}
